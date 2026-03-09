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
                required: [
                  "title",
                  "enhanced_caption",
                  "category",
                ],
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
    // Fallback
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const THREADS_ACCESS_TOKEN = Deno.env.get("THREADS_ACCESS_TOKEN");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!THREADS_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "THREADS_ACCESS_TOKEN not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "LOVABLE_API_KEY not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch posts from Threads API with pagination
    let allPosts: ThreadsPost[] = [];
    let url = `https://graph.threads.net/v1.0/me/threads?fields=id,text,media_url,media_type,permalink,timestamp,thumbnail_url&limit=50&access_token=${THREADS_ACCESS_TOKEN}`;

    // Fetch up to 3 pages (150 posts max per sync)
    for (let page = 0; page < 3 && url; page++) {
      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        console.error("Threads API error:", res.status, errText);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Threads API error: ${res.status}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const data = await res.json();
      allPosts = allPosts.concat(data.data || []);
      url = data.paging?.next || "";
    }

    if (allPosts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No posts found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing post IDs to skip duplicates
    const { data: existing } = await supabase
      .from("stories")
      .select("threads_post_id");

    const existingIds = new Set(
      (existing || []).map((e: { threads_post_id: string }) => e.threads_post_id)
    );

    const newPosts = allPosts.filter((p) => !existingIds.has(p.id));

    let synced = 0;
    for (const post of newPosts) {
      // Skip posts without text or media
      if (!post.text && !post.media_url) continue;

      const aiResult = await enhanceWithAI(post.text || "", LOVABLE_API_KEY);

      const { error } = await supabase.from("stories").insert({
        threads_post_id: post.id,
        original_text: post.text || null,
        ai_enhanced_text: aiResult.enhanced_caption,
        ai_title: aiResult.title,
        category: aiResult.category,
        media_url: post.media_url || post.thumbnail_url || null,
        media_type: post.media_type || null,
        permalink: post.permalink || null,
        posted_at: post.timestamp || null,
        location: aiResult.location || null,
      });

      if (error) {
        console.error("Insert error for post", post.id, error);
      } else {
        synced++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        total_fetched: allPosts.length,
        skipped_existing: allPosts.length - newPosts.length,
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
