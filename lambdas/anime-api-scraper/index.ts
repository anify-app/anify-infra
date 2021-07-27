import { Lambda } from "aws-sdk";
import JikanTS from "jikants";
import cleanMalArrayFields from "./utils/cleanMalArrayFields";
import determineStatus from "./utils/determineStatus";
import determineType from "./utils/determineType";
import determineRelation from "./utils/determineRelations";
import { TextEncoder } from "util";

export const isPresent = <T>(t: T | undefined | null | void): t is T => {
  return t !== undefined && t !== null;
};
type event = { startIndex: number; endIndex: number; total: number };
export const handler = async (event: event) => {
  if (!process.env.ANIME_SCRAPER) {
    console.error("scraper not configured");
    return;
  }
  try {
    const lambda = new Lambda();
    const animeIds = Array.from(Array(event.endIndex)).map(
      (_, idx) => idx + event.startIndex + 1
    );
    // give status update
    console.log(`🟡 [IN PROGRESS] - (${event})`);

    const animePromises = animeIds
      .map(async (id) => {
        const malAnime = await JikanTS.Anime.byId(id);

        if (!malAnime) {
          return null;
        }

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
          sources: malAnime
            ? [{ name: "MyAnimeList", url: malAnime?.url }]
            : [],
          score: malAnime?.score,
        };

        if (anime.genres.includes("Hentai")) {
          console.log(`🔵 [SKIPPED] - Hentai detected, skipping item...`);
          return null;
        }

        return anime;
      })
      .filter(isPresent);

    const animes = await Promise.all(animePromises);

    const scraperPromises = animes.map(async (anime) => {
      await lambda.invoke({
        FunctionName: process.env.ANIME_SCRAPER as string,
        InvocationType: "Event",
        Payload: new TextEncoder().encode(JSON.stringify(anime)),
      });
    });

    const result = await Promise.all(scraperPromises);
    return result;
  } catch {
    return { title: false };
  }
};
