import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ThreadsPost {
  id: string;
  text?: string;
  media_url?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  thumbnail_url?: string;
}

interface AIResult {
  title: string;
  enhanced_caption: string;
  category: string;
  location: string | null;
}

// ── AI Enhancement ──────────────────────────────────────────────────────────

async function enhanceWithAI(
  originalText: string,
  apiKey: string
): Promise<AIResult> {
  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are Cola B's editorial assistant. She is a singer-songwriter and cultural personality.",
          },
          {
            role: "user",
            content: `Rewrite this Threads post into a polished story card for Cola B's website.\n\nOriginal post:\n"${originalText}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_story_card",
              description:
                "Create a polished story card from a Threads post",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description:
                      "Short, catchy title for the story card (max 8 words)",
                  },
                  enhanced_caption: {
                    type: "string",
                    description:
                      "Polished, editorial version of the post (1-2 sentences)",
                  },
                  category: {
                    type: "string",
                    enum: [
                      "music",
                      "travel",
                      "fashion",
                      "events",
                      "studio",
                      "lifestyle",
                      "humor",
                    ],
                  },
                  location: {
                    type: "string",
                    description:
                      "Location mentioned in the post, or null if none",
                  },
                },
                required: ["title", "enhanced_caption", "category"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "create_story_card" },
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI gateway error:", response.status, errText);
    return {
      title: originalText?.slice(0, 40) || "Untitled",
      enhanced_caption: originalText || "",
      category: "lifestyle",
      location: null,
    };
  }

  const data = await response.json();
  try {
    const toolCall = data.choices[0].message.tool_calls[0];
    return JSON.parse(toolCall.function.arguments);
  } catch {
    return {
      title: originalText?.slice(0, 40) || "Untitled",
      enhanced_caption: originalText || "",
      category: "lifestyle",
      location: null,
    };
  }
}

// ── Media Caching ───────────────────────────────────────────────────────────

function getExtension(mediaType?: string): string {
  if (!mediaType) return "jpg";
  if (mediaType === "VIDEO") return "mp4";
  return "jpg"; // IMAGE, CAROUSEL_ALBUM → jpg
}

async function cacheMedia(
  mediaUrl: string,
  storyId: string,
  mediaType: string | undefined,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string | null> {
  try {
    const res = await fetch(mediaUrl);
    if (!res.ok) {
      console.warn(`Failed to fetch media for ${storyId}: ${res.status}`);
      return null;
    }

    const data = await res.arrayBuffer();
    if (data.byteLength < 500) {
      console.warn(`Media too small for ${storyId}, skipping cache`);
      return null;
    }

    const ext = getExtension(mediaType);
    const filePath = `${storyId}.${ext}`;
    const contentType = ext === "mp4" ? "video/mp4" : "image/jpeg";

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/story-media/${filePath}`,
      {
        method: "PUT",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: data,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`Upload failed for ${storyId}: ${errText}`);
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/story-media/${filePath}`;
  } catch (err) {
    console.error(`Media cache error for ${storyId}:`, err);
    return null;
  }
}

// ── Threads API Fetcher ─────────────────────────────────────────────────────

async function fetchAllThreadsPosts(
  accessToken: string
): Promise<ThreadsPost[]> {
  let allPosts: ThreadsPost[] = [];
  let url = `https://graph.threads.net/v1.0/me/threads?fields=id,text,media_url,media_type,permalink,timestamp,thumbnail_url&limit=50&access_token=${accessToken}`;

  for (let page = 0; page < 3 && url; page++) {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Threads API error:", res.status, errText);
      throw new Error(`Threads API error: ${res.status}`);
    }
    const data = await res.json();
    allPosts = allPosts.concat(data.data || []);
    url = data.paging?.next || "";
  }

  return allPosts;
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const THREADS_ACCESS_TOKEN = Deno.env.get("THREADS_ACCESS_TOKEN");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!THREADS_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "THREADS_ACCESS_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch all posts from Threads API (fresh CDN URLs)
    const allPosts = await fetchAllThreadsPosts(THREADS_ACCESS_TOKEN);

    if (allPosts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, refreshed: 0, message: "No posts found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a lookup of fresh CDN URLs by threads_post_id
    const freshMediaMap = new Map<string, { url: string; type?: string }>();
    for (const p of allPosts) {
      const url = p.media_url || p.thumbnail_url;
      if (url) {
        freshMediaMap.set(p.id, { url, type: p.media_type });
      }
    }

    // 2. Get existing post IDs
    const { data: existing } = await supabase
      .from("stories")
      .select("id, threads_post_id, media_url");

    const existingMap = new Map(
      (existing || []).map((e: any) => [e.threads_post_id, e])
    );

    // 3. Process NEW posts
    const newPosts = allPosts.filter((p) => !existingMap.has(p.id));
    let synced = 0;

    for (const post of newPosts) {
      if (!post.text && !post.media_url) continue;

      const aiResult = await enhanceWithAI(post.text || "", LOVABLE_API_KEY);

      // Cache media to storage
      const rawMediaUrl = post.media_url || post.thumbnail_url || null;
      let finalMediaUrl = rawMediaUrl;

      if (rawMediaUrl) {
        const cached = await cacheMedia(
          rawMediaUrl,
          post.id,
          post.media_type,
          supabaseUrl,
          serviceRoleKey
        );
        if (cached) finalMediaUrl = cached;
      }

      const { error } = await supabase.from("stories").upsert(
        {
          threads_post_id: post.id,
          original_text: post.text || null,
          ai_enhanced_text: aiResult.enhanced_caption,
          ai_title: aiResult.title,
          category: aiResult.category,
          media_url: finalMediaUrl,
          media_type: post.media_type || null,
          permalink: post.permalink || null,
          posted_at: post.timestamp || null,
          location: aiResult.location || null,
        },
        { onConflict: "threads_post_id" }
      );

      if (error) {
        console.error("Insert error for post", post.id, error);
      } else {
        synced++;
      }
    }

    // 4. Refresh pass: fix existing stories with expired CDN URLs
    let refreshed = 0;
    const staleStories = (existing || []).filter(
      (e: any) =>
        e.media_url &&
        !e.media_url.includes(supabaseUrl) && // not yet cached
        (e.media_url.includes("cdninstagram.com") ||
          e.media_url.includes("scontent") ||
          e.media_url.includes("fbcdn"))
    );

    for (const story of staleStories) {
      // Try to find a fresh CDN URL from the API response
      const fresh = freshMediaMap.get(story.threads_post_id);
      const sourceUrl = fresh?.url || story.media_url;

      const cached = await cacheMedia(
        sourceUrl,
        story.threads_post_id,
        fresh?.type,
        supabaseUrl,
        serviceRoleKey
      );

      if (cached) {
        const { error } = await supabase
          .from("stories")
          .update({ media_url: cached })
          .eq("id", story.id);

        if (error) {
          console.error("Refresh error for story", story.id, error);
        } else {
          refreshed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        refreshed,
        total_fetched: allPosts.length,
        skipped_existing: allPosts.length - newPosts.length,
        stale_found: staleStories.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
