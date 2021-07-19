import indexer from "algoliasearch";
import { DynamoDBStreamEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

export const isPresent = <T>(t: T | undefined | null | void): t is T => {
  return t !== undefined && t !== null;
};

export const handler = async (event: DynamoDBStreamEvent) => {
  if (!process.env.APP_ID || !process.env.INDEX_ID || !process.env.ADMIN_ID) {
    console.error("index not configured");
    return;
  }

  const { unmarshall } = DynamoDB.Converter;

  const records = event.Records.map((record) => {
    if (!record.dynamodb?.NewImage) {
      return null;
    }
    return unmarshall(record.dynamodb?.NewImage);
  }).filter(isPresent);

  const indexedRecords = records.map(({ relations, ...record }) => ({
    objectID: record.PK,
    ...record,
  }));

  console.log(`found ${indexedRecords.length} records to index`);

  const client = indexer(process.env.APP_ID, process.env.ADMIN_ID);
  const index = client.initIndex(process.env.INDEX_ID);

  index.saveObjects(indexedRecords).then(({ objectIDs }) => {
    console.log(objectIDs);
  });
};
