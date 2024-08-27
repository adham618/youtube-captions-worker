import { getSubtitles } from "@treeee/youtube-caption-extractor";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors());

app.get("/subtitles", async (c) => {
  const { videoId, lang = "en" } = c.req.query();

  if (!videoId) {
    return c.json("Video ID is required", 400);
  }

  try {
    const subtitles = await getSubtitles({ videoID: videoId, lang });
    return c.json(subtitles, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
});

export default app;
