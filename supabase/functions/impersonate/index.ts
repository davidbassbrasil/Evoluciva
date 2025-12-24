// Edge Function: Impersonate a user by creating a short-lived access token
// WARNING: This function must be protected and available only to admins.
// It signs a JWT using the project's JWT secret (SUPABASE_JWT_SECRET) and
// returns an `access_token` which the frontend can use to set a Supabase session.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
// Use Web Crypto (built-in in Deno) to sign HS256 JWTs and avoid external bundles

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !JWT_SECRET) {
      console.error('[impersonate] Missing SUPABASE_URL or SERVICE_ROLE_KEY or JWT_SECRET');
      return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await req.json();
    const profileId = body.profileId;

    if (!profileId) {
      return new Response(JSON.stringify({ success: false, error: 'profileId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch user to ensure exists
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', profileId)
      .single();

    if (profileErr || !profile) {
      console.error('[impersonate] profile fetch error', profileErr);
      return new Response(JSON.stringify({ success: false, error: 'Profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build JWT - signed with JWT_SECRET using Web Crypto (HMAC SHA-256)
    const encoder = new TextEncoder();
    const now = Math.floor(Date.now() / 1000);
    const iat = now;
    const exp = now + 60 * 10; // 10 minutes

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      role: 'authenticated',
      iat,
      iss: SUPABASE_URL,
      aud: 'authenticated',
      sub: profile.id,
      exp,
    };

    function base64UrlEncode(input: string | Uint8Array) {
      let bytes: Uint8Array;
      if (typeof input === 'string') {
        bytes = encoder.encode(input);
      } else {
        bytes = input;
      }

      // Convert bytes to binary string for btoa
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as any);
      }
      const b64 = btoa(binary);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    async function signJwtHS256(headerObj: any, payloadObj: any, secret: string) {
      const header64 = base64UrlEncode(JSON.stringify(headerObj));
      const payload64 = base64UrlEncode(JSON.stringify(payloadObj));
      const data = `${header64}.${payload64}`;

      const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
      const sigBytes = new Uint8Array(signature as ArrayBuffer);
      const sig64 = base64UrlEncode(sigBytes);
      return `${data}.${sig64}`;
    }

    const token = await signJwtHS256(header, payload, JWT_SECRET);

    // Return token to frontend
    return new Response(JSON.stringify({ success: true, access_token: token, message: 'Impersonation token generated (short lived).' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('[impersonate] unexpected error', err);
    return new Response(JSON.stringify({ success: false, error: err.message || String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
