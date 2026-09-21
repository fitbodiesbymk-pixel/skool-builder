/**
 * Cloudflare Worker — Anthropic API Proxy
 *
 * Environment variable required:
 *   ANTHROPIC_API_KEY  →  your Anthropic secret key (set as a Worker Secret)
 *
 * Deploy steps:
 *   1. Go to dash.cloudflare.com → Workers & Pages → Create Worker
 *   2. Paste this file into the editor and Save & Deploy
 *   3. Go to Settings → Variables → Add secret: ANTHROPIC_API_KEY
 *   4. Copy the Worker URL (e.g. https://skool-builder.YOUR_SUBDOMAIN.workers.dev)
 *   5. Paste that URL into index.html → const WORKER_URL = '...'
 */

export default {
  async fetch(request, env) {

    // CORS headers — lock down to your GitHub Pages domain once live
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY secret not set on this Worker.' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.text();

      const upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body,
      });

      // Stream the response straight back (works for both streaming and non-streaming)
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          ...corsHeaders,
          'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: { message: err.message } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
