const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const storageBase = `${supabaseUrl}/storage/v1`;
    const publicBase = `${supabaseUrl}/storage/v1/object/public/album-art`;

    // Fetch all releases
    const relRes = await fetch(
      `${supabaseUrl}/rest/v1/releases?select=id,title,video_id,thumbnail_url&order=sort_order.asc&limit=1000`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
    );
    const releases = await relRes.json();
    console.log(`Found ${releases.length} releases`);

    let cached = 0, skipped = 0, failed = 0;
    const errors: string[] = [];

    for (const release of releases) {
      // Skip if already cached in our storage
      if (release.thumbnail_url?.includes(supabaseUrl)) {
        skipped++;
        continue;
      }

      // Try sources in order: current thumbnail_url, then YouTube video thumbnail
      const sources = [
        release.thumbnail_url?.replace(/&amp;/g, '&'),
        release.video_id ? `https://i.ytimg.com/vi/${release.video_id}/maxresdefault.jpg` : null,
        release.video_id ? `https://img.youtube.com/vi/${release.video_id}/mqdefault.jpg` : null,
      ].filter(Boolean) as string[];

      let imageData: ArrayBuffer | null = null;
      let contentType = 'image/jpeg';

      for (const src of sources) {
        try {
          const res = await fetch(src);
          if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
            imageData = await res.arrayBuffer();
            contentType = res.headers.get('content-type') || 'image/jpeg';
            // Skip YouTube's default grey placeholder (it's tiny)
            if (imageData.byteLength < 1000) {
              imageData = null;
              continue;
            }
            break;
          }
        } catch {
          // try next source
        }
      }

      if (!imageData) {
        failed++;
        errors.push(release.title);
        console.warn(`No image found for "${release.title}"`);
        continue;
      }

      // Upload to storage
      const filePath = `${release.id}.jpg`;
      const uploadRes = await fetch(`${storageBase}/object/album-art/${filePath}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: imageData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error(`Upload failed for "${release.title}": ${errText}`);
        failed++;
        errors.push(release.title);
        continue;
      }

      // Update release with permanent URL
      const permanentUrl = `${publicBase}/${filePath}`;
      await fetch(`${supabaseUrl}/rest/v1/releases?id=eq.${release.id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ thumbnail_url: permanentUrl }),
      });

      cached++;
      console.log(`✓ Cached "${release.title}"`);

      // Small delay to be nice
      await new Promise(r => setTimeout(r, 200));
    }

    const summary = {
      success: true,
      total: releases.length,
      cached,
      skipped,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };
    console.log('Cache complete:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cache error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
