import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import { getPlaiceholder, IGetPlaiceholderReturn } from "plaiceholder";
import slugify from "slugify";
import * as getColors from "get-image-colors";
//@ts-expect-error no default export type for crypto
import crypto from "crypto";

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
  score: string | undefined;
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
  blurredMainImage: string;
  score: string | undefined;
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
  if (!event.title) {
    console.log("no title, skipping");
    return;
  }
  // extract attributes from event
  const { title, mainImage, airedStart } = event;

  // create domain model
  const AnimeEntity = dynamoose.model<AnimeEntity>("anime", schema, {
    create: false,
  });

  //generate slug
  const slug = slugify(title);

  //create unique id based on airedStart and title
  const id = crypto
    .createHash("sha256", slug)
    .update(airedStart)
    .digest("hex");

  let placiholder: IGetPlaiceholderReturn | undefined;
  let colors: Array<string> | undefined;
  if (mainImage) {
    placiholder = await getPlaiceholder(mainImage);
    colors = await getColors(mainImage).then((colors) =>
      colors.map((color) => color.hex())
    );
  }

  // create instance of the model
  const anime = new AnimeEntity({
    PK: { id, entity: "ANIME" },
    SK: { id: "v1", entity: "VERSION" },
    id,
    GSI1PK: { id: slug, entity: "TITLE" },
    slug,
    colors,
    mainImageBlurred: placiholder?.base64,
    ...event,
  });

  // save model to dynamo
  return await anime.save().catch((err) => console.error(err));
};
