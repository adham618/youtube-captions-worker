import { Hono } from "hono";

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
    return transcriptData?.transcript?.content?.body?.initial_segments.map(
      (segment) => ({
        text: segment.snippet.text,
        start: Number(segment.start_ms),
        end: Number(segment.end_ms),
      })
    );
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
};

app.get("/subtitles", async (c) => {
  const { videoId, lang = "en" } = c.req.query();

  if (!videoId) {
    return c.json("Video ID is required", 400);
  }

  try {
    const subtitles = await fetchTranscript(videoId, lang);

    return c.json(subtitles, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default app;
