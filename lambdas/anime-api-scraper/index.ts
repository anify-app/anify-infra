import { Lambda } from "aws-sdk";
import JikanTS from "jikants";
import cleanMalArrayFields from "./utils/cleanMalArrayFields";
import determineStatus from "./utils/determineStatus";
import determineType from "./utils/determineType";
import determineRelation from "./utils/determineRelations";
import { handler as scraper } from "../anime-scraper/index";
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

  const animeIds = Array.from(Array(event.endIndex - event.startIndex + 1)).map(
    (_, idx) => idx + event.startIndex + 1
  );
  // give status update
  console.log(`🟡 [IN PROGRESS] - (${JSON.stringify(event, null, 2)})`);

  for (const id of animeIds) {
    try {
      const malAnime = await JikanTS.Anime.byId(id);

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
          airedStart: new Date(malAnime?.aired?.from).toISOString(),
          airedEnd: malAnime?.aired
            ? new Date(malAnime?.aired?.to).toISOString()
            : null,
          duration: malAnime?.duration,
          producers: cleanMalArrayFields(malAnime?.producers),
          licensors: cleanMalArrayFields(malAnime?.licensors),
          studios: cleanMalArrayFields(malAnime?.studios),
          malId: malAnime.mal_id,
          sourceMaterialType: malAnime?.source,
          englishTitle: malAnime?.title_english,
          japaneseTitle: malAnime?.title_japanese,
          synonyms: malAnime?.title_synonyms,
          sources: malAnime
            ? [{ name: "MyAnimeList", url: malAnime?.url }]
            : [],
          score: malAnime?.score,
        };

        console.log(`ID: ${id} | TITLE: ${anime.title}`);

        const hasHentai = anime.genres.includes("Hentai");

        if (hasHentai) {
          console.log(
            `🔵 [SKIPPED] - Hentai detected, skipping item | ID: ${id}...`
          );
        }

        if (!hasHentai) await scraper(anime);
      }
    } catch {}
  }
  return "done";
};
