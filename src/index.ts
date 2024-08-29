import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

import { Innertube } from "youtubei.js/cf-worker";

type Response = {
  text: string | undefined;
  start: number;
  end: number;
};

const fetchTranscript = async (
  videoId: string,
  lang: string
): Promise<(Response | undefined)[] | undefined> => {
  const youtube = await Innertube.create({
    lang: lang,
    location: "US",
    retrieve_player: false,
  });

  try {
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();
    console.log(transcriptData.transcript?.content?.body);

    return transcriptData?.transcript?.content?.body?.initial_segments
      .filter((segment) => segment.type !== "TranscriptSectionHeader")
      .map((segment) => {
        return {
          text: segment.snippet.text,
          start: Number(segment.start_ms),
          end: Number(segment.end_ms),
        };
      })
      .filter((segment) => segment.text && !segment.text.includes("[Music]"));
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
};

app.use(cors()).get("/subtitles", async (c) => {
  const { videoId, lang = "en" } = c.req.query();

  if (!videoId) {
    return c.json({ error: "Video ID is required" }, 400);
  }

  try {
    const subtitles = await fetchTranscript(videoId, lang);

    if (!subtitles) {
      return c.json({ error: "No subtitles found." }, 404);
    }

    return c.json(subtitles, 200);
  } catch (error) {
    console.error(
      `Error fetching subtitles for videoId: ${videoId}, lang: ${lang}`,
      error
    );
    return c.json({ error: { message: "Internal Server Error" } }, 500);
  }
});

export default app;
