import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";

type AnimeTableAttributes = { id: string; entity: string };
const schema = new dynamoose.Schema(
  {
    //@ts-expect-error we allow val to have AnimeTableAttributes
    PK: {
      type: Object,
      hashKey: true,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
      // "get": (val) =>  // split the string on # and return an object
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    SK: {
      type: Object,
      rangeKey: true,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
      // "get": (val) =>  // split the string on # and return an object
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI1PK: {
      type: Object,
      index: {
        name: "GSI1",
        rangeKey: "GSI1SK",
      },
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
      // "get": (val) =>  // split the string on # and return an object
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI1SK: {
      type: Object,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
      // "get": (val) =>  // split the string on # and return an object
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI2PK: {
      type: Object,
      index: {
        name: "GSI2",
        rangeKey: "GSI2SK",
      },
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
      // "get": (val) =>  // split the string on # and return an object
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI2SK: {
      type: Object,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
      // "get": (val) =>  // split the string on # and return an object
    },
  },
  {
    saveUnknown: true, // use attributes which aren't defined in the schema
    timestamps: true,
  }
);

type Event = {
  id: string;
  title: string;
  genres: Array<string>;
  type: string;
  status: string;
  rating: string | undefined;
  episodes: number | undefined;
  mainImage: string | undefined;
  season: string | undefined;
  airedStart: string | undefined;
  airedEnd: string | undefined;
  duration: string | undefined;
  sourceMaterialType: string;
  producers: Array<string>;
  licensors: Array<string>;
  studios: Array<string>;
  sources: Array<{
    name: string;
    url: string;
  }>;
  englishTitle: string | undefined;
  japaneseTitle: string | undefined;
  synonyms: Array<string>;
};
class AnimeEntity extends Document implements Omit<Event, "id"> {
  PK: AnimeTableAttributes;
  SK: AnimeTableAttributes;
  GSI1PK: AnimeTableAttributes;
  GSI1SK: AnimeTableAttributes;
  GSI2PK: AnimeTableAttributes;
  GSI2SK: AnimeTableAttributes;
  title: string;
  type: string;
  genres: Array<string>;
  status: string;
  sourceMaterialType: string;
  rating: string | undefined;
  episodes: number | undefined;
  mainImage: string | undefined;
  season: string | undefined;
  airedStart: string | undefined;
  airedEnd: string | undefined;
  duration: string | undefined;
  producers: Array<string>;
  licensors: Array<string>;
  studios: Array<string>;
  sources: Array<{
    name: string;
    url: string;
  }>;
  englishTitle: string | undefined;
  japaneseTitle: string | undefined;
  synonyms: Array<string>;
}

export const handler = async (event: Event) => {
  // extract attributes from event
  const {
    title,
    id,
    mainImage,
    episodes,
    rating,
    status,
    genres,
    season,
    airedStart,
    airedEnd,
    duration,
    producers,
    sourceMaterialType,
    licensors,
    studios,
    sources,
    englishTitle,
    japaneseTitle,
    synonyms,
  } = event;

  // create domain model
  const AnimeEntity = dynamoose.model<AnimeEntity>("anime", schema, {
    create: false,
  });

  // create instance of the model
  const anime = new AnimeEntity({
    PK: { id, entity: "ANIME" },
    SK: { id: "v1", entity: "VERSION" },
    GSI1PK: { id: airedStart, entity: "AIREDSTART" },
    GSI1SK: { id: season, entity: "SEASON" },
    GSI2PK: { id: status, entity: "STATUS" },
    title,
    episodes,
    mainImage,
    status,
    genres,
    rating,
    season,
    airedStart,
    airedEnd,
    duration,
    producers,
    licensors,
    studios,
    sourceMaterialType,
    sources,
    englishTitle,
    japaneseTitle,
    synonyms,
  });

  // save model to dynamo
  return await anime.save().catch((err) => console.error(err));
};
