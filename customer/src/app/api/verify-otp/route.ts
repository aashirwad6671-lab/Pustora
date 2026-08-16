export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://erhuepjjtuwnpzcgduxz.supabase.co';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyaHVlcGpqdHV3bnB6Y2dkdXh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzA5MiwiZXhwIjoyMDk1OTg5MDkyfQ.UA0R3QkoAO1cnjXicaDGdM8nRgzJ-ucsAC9eyVyGNow';
const validUrl = (url: string) => {
  try { return new URL(url).protocol.startsWith('http'); } catch { return false; }
};
const supabaseAdmin = createClient(
  validUrl(rawUrl) ? rawUrl : 'https://placeholder-pustora.supabase.co',
  rawKey
);

const MAX_ATTEMPTS = 5;

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = await hashOTP(String(otp).trim());
    const now = new Date().toISOString();

    // Find latest unused, unexpired OTP for this email
    const { data: records, error: fetchError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .is('used_at', null)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('DB fetch error:', fetchError);
      return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.', expired: true },
        { status: 400 }
      );
    }

    const record = records[0];

    // Check attempt count
    if (record.attempt_count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new OTP.', maxAttemptsReached: true },
        { status: 429 }
      );
    }

    // Verify OTP hash
    if (record.otp_hash !== otpHash) {
      // Increment attempt count
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempt_count: record.attempt_count + 1 })
        .eq('id', record.id);

      const remaining = MAX_ATTEMPTS - record.attempt_count - 1;
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Incorrect OTP. No attempts remaining. Please request a new code.',
          remaining,
        },
        { status: 400 }
      );
    }

    // ✅ OTP is correct — mark as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used_at: now })
      .eq('id', record.id);

    // Auto-confirm user in Supabase Auth — fast direct REST lookup (avoids slow listUsers)
    let confirmedUserId: string | null = null;
    try {
      // Use Supabase Auth Admin REST API directly to lookup by email
      const authRes = await fetch(
        `${rawUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalizedEmail)}`,
        {
          headers: {
            apikey: rawKey,
            Authorization: `Bearer ${rawKey}`,
          },
        }
      );
      if (authRes.ok) {
        const authData = await authRes.json();
        const userMatch = authData?.users?.[0];
        if (userMatch) {
          confirmedUserId = userMatch.id;
          if (!userMatch.email_confirmed_at) {
            await supabaseAdmin.auth.admin.updateUserById(userMatch.id, {
              email_confirm: true,
            });
          }
        }
      }
    } catch (authErr) {
      console.warn('Auto email confirm notice:', authErr);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully.',
      userId: confirmedUserId,
    });

  } catch (err: any) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
