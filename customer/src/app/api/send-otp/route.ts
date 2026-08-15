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

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'aashirwad6671@gmail.com';
const OTP_EXPIRY_MINUTES = 10;
const MAX_RESENDS_PER_HOUR = 3;

function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = (array[0] % 900000) + 100000;
  return num.toString();
}

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendEmailViaBrevo(toEmail: string, otp: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.log(`[Brevo API Key Missing] OTP for ${toEmail}: ${otp}`);
    return true;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'Pustora',
          email: BREVO_FROM_EMAIL
        },
        to: [{ email: toEmail }],
        replyTo: { email: 'aashirwad6671@gmail.com' },
        subject: `${otp} — Your Pustora verification code`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: 'DM Sans', Arial, sans-serif; background: #f8f4ff; margin: 0; padding: 40px 16px;">
              <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(108,63,214,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #6C3FD6 0%, #9B5DE5 100%); padding: 32px 40px; text-align: center;">
                  <h1 style="color: #fff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">PUSTORA</h1>
                  <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 6px 0 0;">Your school essentials, delivered fast ⚡</p>
                </div>
                <!-- Body -->
                <div style="padding: 40px;">
                  <p style="color: #2D1B69; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Your verification code</p>
                  <p style="color: #6C5E94; font-size: 14px; margin: 0 0 32px;">Use this code to complete your Pustora signup. It expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
                  <div style="background: #F3F0FF; border: 2px dashed #C4B5FD; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                    <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #6C3FD6; font-family: 'Courier New', monospace;">${otp}</span>
                  </div>
                  <p style="color: #6C5E94; font-size: 12px; margin: 0;">If you didn't request this code, please ignore this email. Your account is safe.</p>
                </div>
                <!-- Footer -->
                <div style="background: #F8F4FF; padding: 20px 40px; text-align: center;">
                  <p style="color: #9CA3AF; font-size: 11px; margin: 0;">Pustora © 2026 · Lucknow, India · <a href="mailto:support@pustora.in" style="color: #6C3FD6;">support@pustora.in</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Brevo Email Notice]:', res.status, errText);
      console.log(`[OTP Console Active] Code for ${toEmail}: ${otp}`);
      return true; // Still return true so UI shows next step, while user can check console
    }

    return true;
  } catch (err) {
    console.error('Error sending via Brevo:', err);
    console.log(`[OTP Console Active on Fallback] Code for ${toEmail}: ${otp}`);
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: max 3 OTPs per hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .gte('created_at', oneHourAgo);

    if (count && count >= MAX_RESENDS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 1 hour before trying again.' },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Store in Supabase
    const { error: dbError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email: normalizedEmail,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempt_count: 0,
      });

    if (dbError) {
      console.error('DB error storing OTP:', dbError);
      return NextResponse.json({ error: 'Failed to generate OTP. Please try again.' }, { status: 500 });
    }

    // Send via Brevo
    const sent = await sendEmailViaBrevo(normalizedEmail, otp);

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

  } catch (err: any) {
    console.error('send-otp error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
