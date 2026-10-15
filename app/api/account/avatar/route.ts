import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a JPEG, PNG, WebP, or AVIF image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file size must not exceed 5MB.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'avatars');
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880,
      });
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update Supabase Auth user_metadata
    const updatedMetadata = {
      ...(user.user_metadata || {}),
      avatar_url: publicUrl,
    };

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: updatedMetadata,
    });

    if (authError) {
      console.error('Failed to update user auth metadata with avatar:', authError);
    }

    // Also update profiles table shipping_address._avatar_url for SQL query fallback
    try {
      const { data: profile } = await (supabaseAdmin.from('profiles') as any)
        .select('shipping_address')
        .eq('id', user.id)
        .maybeSingle();

      const currentAddress = profile?.shipping_address || {};
      await (supabaseAdmin.from('profiles') as any)
        .update({
          shipping_address: {
            ...currentAddress,
            _avatar_url: publicUrl,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (e) {
      console.error('Failed to update profile shipping_address with avatar fallback:', e);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      message: 'Profile picture updated successfully!',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error uploading avatar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove from auth user_metadata
    const updatedMetadata = {
      ...(user.user_metadata || {}),
      avatar_url: null,
    };

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: updatedMetadata,
    });

    // Remove from profiles table
    try {
      const { data: profile } = await (supabaseAdmin.from('profiles') as any)
        .select('shipping_address')
        .eq('id', user.id)
        .maybeSingle();

      const currentAddress = { ...(profile?.shipping_address || {}) };
      delete currentAddress._avatar_url;

      await (supabaseAdmin.from('profiles') as any)
        .update({
          shipping_address: currentAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error removing avatar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
