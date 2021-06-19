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
    title: String,
    episodes: Number,
    mainImage: String,
    rating: String,
    status: String,
    genres: {
      type: Array,
      schema: [String],
    },
    // ... Add more attributes here
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
};
class AnimeEntity extends Document implements Omit<Event, "id"> {
  PK: AnimeTableAttributes;
  SK: AnimeTableAttributes;
  title: string;
  type: string;
  genres: Array<string>;
  status: string;
  rating: string | undefined;
  episodes: number | undefined;
  mainImage: string | undefined;
}

export const handler = async (event: Event) => {
  // extract attributes from event
  const { title, id, mainImage, episodes, rating, status, genres } = event;

  // create domain model
  const AnimeEntity = dynamoose.model<AnimeEntity>("anime", schema, {
    create: false,
  });

  // create instance of the model
  const anime = new AnimeEntity({
    PK: { id, entity: "ANIME" },
    SK: { id: "v1", entity: "VERSION" },
    title,
    episodes,
    mainImage,
    status,
    genres,
    rating,
  });

  // save model to dynamo
  return await anime.save().catch((err) => console.error(err));
};
