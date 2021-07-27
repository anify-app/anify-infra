import { Lambda } from "aws-sdk";
import JikanTS from "jikants";
import cleanMalArrayFields from "./utils/cleanMalArrayFields";
import determineStatus from "./utils/determineStatus";
import determineType from "./utils/determineType";
import determineRelation from "./utils/determineRelations";
import { TextEncoder } from "util";
export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const isPresent = <T>(t: T | undefined | null | void): t is T => {
  return t !== undefined && t !== null;
};
type event = { startIndex: number; endIndex: number; total: number };
export const handler = async (event: event) => {
  if (!process.env.ANIME_SCRAPER) {
    console.error("scraper not configured");
    return;
  }

  const lambda = new Lambda({ region: "us-east-1" });
  const animeIds = Array.from(Array(event.endIndex)).map(
    (_, idx) => idx + event.startIndex + 1
  );
  // give status update
  console.log(`🟡 [IN PROGRESS] - (${JSON.stringify(event, null, 2)})`);

  for (const id of animeIds) {
    await delay(1000);
    const malAnime = await JikanTS.Anime.byId(id).catch(() => undefined);

    if (malAnime) {
      const anime = {
        title: malAnime?.title,
        relations: determineRelation(malAnime.related),
        description: malAnime?.synopsis,
        trailer: malAnime?.trailer_url,
        type: determineType(malAnime?.type || ""),
        episodes: malAnime?.episodes,
        status: determineStatus(malAnime?.status || ""),
        mainImage: malAnime?.image_url,
        rating: malAnime?.rating,
        genres: cleanMalArrayFields(malAnime?.genres),
        season: malAnime?.premiered?.split(" ")[0],
        airedStart: malAnime?.aired
          ? new Date(malAnime?.aired?.from).toISOString()
          : null,
        airedEnd: malAnime?.aired
          ? new Date(malAnime?.aired?.to).toISOString()
          : null,
        duration: malAnime?.duration,
        producers: cleanMalArrayFields(malAnime?.producers),
        licensors: cleanMalArrayFields(malAnime?.licensors),
        studios: cleanMalArrayFields(malAnime?.studios),
        sourceMaterialType: malAnime?.source,
        englishTitle: malAnime?.title_english,
        japaneseTitle: malAnime?.title_japanese,
        synonyms: malAnime?.title_synonyms,
        sources: malAnime ? [{ name: "MyAnimeList", url: malAnime?.url }] : [],
        score: malAnime?.score,
      };

      if (anime.genres.includes("Hentai")) {
        console.log(`🔵 [SKIPPED] - Hentai detected, skipping item...`);
        return null;
      }

      await lambda
        .invoke({
          FunctionName: process.env.ANIME_SCRAPER as string,
          InvocationType: "RequestResponse",
          Payload: JSON.stringify(anime),
        })
        .promise();
    }
  }
};
