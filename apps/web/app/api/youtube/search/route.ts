import { NextResponse } from "next/server";
import { youtubeSearchSchema } from "@karaoke-queue/validation";
import { API_ERROR_CODES } from "@karaoke-queue/shared";
import { createClient } from "@/lib/supabase/server";
import { YouTubeService } from "@/lib/youtube/service";
import { cacheYouTubeVideos } from "@/lib/youtube/cache";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: API_ERROR_CODES.UNAUTHORIZED, message: "Sign in required." }
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = youtubeSearchSchema.safeParse({
    query: searchParams.get("query") ?? "",
    pageToken: searchParams.get("pageToken") ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: API_ERROR_CODES.VALIDATION_ERROR, message: "Enter a search term." }
      },
      { status: 400 }
    );
  }

  try {
    const result = await YouTubeService.searchVideos(
      parsed.data.query,
      parsed.data.pageToken
    );

    // Best-effort cache; never block the response on it.
    void cacheYouTubeVideos(supabase, result.videos);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("YouTube search failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: API_ERROR_CODES.YOUTUBE_SEARCH_FAILED,
          message: "YouTube search failed. Please try again."
        }
      },
      { status: 502 }
    );
  }
}
