import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, shippingAddress, newPassword, avatarUrl } = body;

    let passwordUpdated = false;

    // Handle avatarUrl update in user_metadata
    if (avatarUrl !== undefined) {
      const currentMeta = user.user_metadata || {};
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...currentMeta,
          avatar_url: avatarUrl || null,
        },
      });
    }

    // 1. Password change
    if (newPassword && typeof newPassword === 'string') {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword.trim(),
      });

      if (pwdError) {
        return NextResponse.json(
          { error: `Password update failed: ${pwdError.message}` },
          { status: 500 }
        );
      }

      passwordUpdated = true;
    }

    // 2. Profile updates
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      updates.full_name = typeof fullName === 'string' ? fullName.trim() : null;
    }

    if (phone !== undefined) {
      updates.phone = typeof phone === 'string' ? phone.trim() : null;
    }

    if (shippingAddress !== undefined) {
      updates.shipping_address = shippingAddress;
    }

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin.from('profiles') as any)
      .update(updates)
      .eq('id', user.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Profile update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      passwordUpdated,
      message: passwordUpdated
        ? 'Profile details and password updated successfully!'
        : 'Profile details saved successfully!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
