import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import slugify from "slugify";

type AnimeTableAttributes = { id: string; entity: string };
const schema = new dynamoose.Schema(
  {
    //@ts-expect-error we allow val to have AnimeTableAttributes
    PK: {
      type: Object,
      hashKey: true,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    SK: {
      type: Object,
      rangeKey: true,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI1PK: {
      type: Object,
      index: {
        name: "GSI1",
        rangeKey: "GSI1SK",
      },
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI1SK: {
      type: Object,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI2PK: {
      type: Object,
      index: {
        name: "GSI2",
        rangeKey: "GSI2SK",
      },
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
    },
    //@ts-expect-error we allow val to have AnimeTableAttributes
    GSI2SK: {
      type: Object,
      set: (val: AnimeTableAttributes) => `${val.entity}#${val.id}`,
    },
  },
  {
    saveUnknown: true, // use attributes which aren't defined in the schema
    timestamps: true,
  }
);

type Event = {
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
  description: string | undefined;
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
class AnimeEntity extends Document implements Event {
  PK: AnimeTableAttributes;
  SK: AnimeTableAttributes;
  GSI1PK: AnimeTableAttributes;
  GSI1SK: AnimeTableAttributes;
  GSI2PK: AnimeTableAttributes;
  GSI2SK: AnimeTableAttributes;
  title: string;
  slug: string;
  type: string;
  genres: Array<string>;
  status: string;
  sourceMaterialType: string;
  rating: string | undefined;
  episodes: number | undefined;
  mainImage: string | undefined;
  description: string | undefined;
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
  const { title, status, season, airedStart } = event;

  // create domain model
  const AnimeEntity = dynamoose.model<AnimeEntity>("anime", schema, {
    create: false,
  });
  const slug = slugify(title);
  // create instance of the model
  const anime = new AnimeEntity({
    PK: { id: slug, entity: "ANIME" },
    SK: { id: "v1", entity: "VERSION" },
    GSI1PK: { id: airedStart, entity: "AIREDSTART" },
    GSI1SK: { id: season, entity: "SEASON" },
    GSI2PK: { id: status, entity: "STATUS" },
    slug,
    ...event,
  });

  // save model to dynamo
  return await anime.save().catch((err) => console.error(err));
};
