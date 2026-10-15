import { NextResponse } from 'next/server';
import { requireStaffOrAdmin } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffOrAdmin();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { fullName, phone, role, shippingAddress, newPassword, avatarUrl } = body;

    let passwordUpdated = false;

    // Handle avatarUrl update in user_metadata
    if (avatarUrl !== undefined) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(id);
        const currentMeta = userData?.user?.user_metadata || {};
        await supabaseAdmin.auth.admin.updateUserById(id, {
          user_metadata: {
            ...currentMeta,
            avatar_url: avatarUrl || null,
          },
        });
      } catch (e) {
        console.warn('Failed to update customer avatar metadata:', e);
      }
    }

    // 1. If password change requested, execute via Supabase Auth Admin
    if (newPassword && typeof newPassword === 'string') {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }

      const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: newPassword.trim(),
      });

      if (pwdError) {
        console.error('Admin password update error:', pwdError);
        return NextResponse.json(
          { error: `Failed to update password: ${pwdError.message}` },
          { status: 500 }
        );
      }

      passwordUpdated = true;
    }

    // 2. Prepare profile updates
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      updates.full_name = typeof fullName === 'string' ? fullName.trim() : null;
    }

    if (phone !== undefined) {
      updates.phone = typeof phone === 'string' ? phone.trim() : null;
    }

    if (role !== undefined && ['customer', 'staff', 'manager', 'admin'].includes(role)) {
      updates.role = role;
    }

    if (shippingAddress !== undefined) {
      updates.shipping_address = shippingAddress;
    }

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin.from('profiles') as any)
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Admin profile update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: updatedProfile,
      passwordUpdated,
      message: passwordUpdated
        ? 'Customer profile and password updated successfully.'
        : 'Customer profile updated successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Customer update failed';
    const status = msg.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
