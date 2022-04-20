import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
type event = {
  totalToProcess: number;
  processAtIndex?: number;
  factor?: number;
};

const schema = new dynamoose.Schema(
  {
    PK: {
      type: String,
      hashKey: true,
    },

    SK: {
      type: String,
      rangeKey: true,
    },

    GSI1PK: {
      type: String,
      index: {
        name: "GSI1",
      },
    },
    GSI2PK: {
      type: String,
      index: {
        name: "GSI2",
      },
    },
  },
  {
    saveUnknown: true, // use attributes which aren't defined in the schema
    timestamps: true,
  }
);
class Entity extends Document {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  processAtIndex: number;
  GSI2SK: string;
  totalToProcess: number;
}
export const handler = async (event: event) => {
  // create domain model
  const Entity = dynamoose.model<Entity>("anime-tasks", schema, {
    create: false,
  });
  const processor = await Entity.get({ PK: "TASK#SCRAPER", SK: "VERSION#1" });
  if (processor === null || processor === undefined) {
    await Entity.create({
      PK: "TASK#SCRAPER",
      SK: "VERSION#1",
      totalToProcess: 50,
      processAtIndex: 0,
    });
  }

  const arrayOfNums = Array.from(
    Array(
      processor?.totalToProcess ||
        event.totalToProcess ||
        50 / (event.factor || 50)
    )
  ).map((_, idx) => [
    idx * (event.factor || 50) +
      (processor?.processAtIndex || event.processAtIndex || 0),
    idx * (event.factor || 50) +
      (event.factor ? event.factor - 1 : 49) +
      (processor?.processAtIndex || event.processAtIndex || 0),
  ]);

  const ids = arrayOfNums.map((entry) => {
    return {
      startIndex: entry[0],
      endIndex: entry[1],
      total: processor?.totalToProcess || event.totalToProcess,
    };
  });

  console.log(
    "🟢 [SUCCESS] - Ids generated - Number of ids to scrap:",
    ids.length
  );

  await Entity.update({
    PK: "TASK#SCRAPER",
    SK: "VERSION#1",
    processAtIndex:
      processor?.processAtIndex || 0 + processor?.totalToProcess || 50,
  });

  return ids;
};
