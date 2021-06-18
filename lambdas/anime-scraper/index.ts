import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";

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
    // ... Add more attributes here
  },
  {
    saveUnknown: true, // use attributes which aren't defined in the schema
    timestamps: true,
  }
);

type AnimeTableAttributes = { id: string; entity: string };
class AnimeEntity extends Document {
  PK: AnimeTableAttributes;
  SK: AnimeTableAttributes;
  title: string;
}
export const handler = async (event: { title: string; id: string }) => {
  // create domain model
  const AnimeEntity = dynamoose.model<AnimeEntity>("anime", schema, {
    create: false,
  });

  // extract attributes from event
  const { title, id } = event;

  // create instance of the model
  const anime = new AnimeEntity({
    PK: { id, entity: "ANIME" },
    SK: { id: "v1", entity: "VERSION" },
    title,
  });

  // save model to dynamo
  return await anime.save().catch((err) => console.error(err));
};
