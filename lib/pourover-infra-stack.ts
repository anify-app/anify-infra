import * as cdk from "@aws-cdk/core";
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from "@aws-cdk/aws-dynamodb";
import { Duration, SecretValue } from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { StartingPosition } from "@aws-cdk/aws-lambda";
import { DynamoEventSource } from "@aws-cdk/aws-lambda-event-sources";

export class PouroverInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // lambda function to scrape anime
    const animeScraper = new NodejsFunction(this, "AnimeScraper", {
      entry: "lambdas/anime-scraper/index.ts",
      handler: "handler",
      memorySize: 1024,
      timeout: Duration.seconds(30),
      functionName: "anime-scraper",
    });

    // dynamodb table Single Table Design
    const animeTable = new Table(this, "AnimeDB", {
      tableName: "anime",
      stream: StreamViewType.NEW_IMAGE,
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    animeTable.addGlobalSecondaryIndex({
      indexName: "GSI1",
      sortKey: { name: "GSI1SK", type: AttributeType.STRING },
      partitionKey: { name: "GSI1PK", type: AttributeType.STRING },
    });

    animeTable.addGlobalSecondaryIndex({
      indexName: "GSI2",
      sortKey: { name: "GSI2SK", type: AttributeType.STRING },
      partitionKey: { name: "GSI2PK", type: AttributeType.STRING },
    });

    // lambda function to index anime
    const animeIndexer = new NodejsFunction(this, "AnimeIndexer", {
      entry: "lambdas/anime-indexer/index.ts",
      handler: "handler",
      memorySize: 4096,
      timeout: Duration.seconds(240),
      functionName: "anime-indexer",
      environment: {
        APP_ID: SecretValue.secretsManager("gh", {
          jsonField: "APP_ID",
        }).toString(),
        ADMIN_ID: SecretValue.secretsManager("gh", {
          jsonField: "ADMIN_ID",
        }).toString(),
        INDEX_ID: SecretValue.secretsManager("gh", {
          jsonField: "INDEX_ID",
        }).toString(),
      },
    });

    animeIndexer.addEventSource(
      new DynamoEventSource(animeTable, {
        batchSize: 500,
        tumblingWindow: cdk.Duration.seconds(30),
        maxBatchingWindow: cdk.Duration.minutes(3),
        startingPosition: StartingPosition.TRIM_HORIZON,
      })
    );
    animeTable.grantStreamRead(animeIndexer);

    // grant lambda full operational access to table
    animeTable.grantFullAccess(animeScraper);
  }
}
