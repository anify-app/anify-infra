import * as cdk from "@aws-cdk/core";
import {
  AttributeType,
  BillingMode,
  StreamViewType,
  Table,
} from "@aws-cdk/aws-dynamodb";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import {
  Map,
  StateMachine,
  StateMachineType,
  Choice,
  Succeed,
  Condition,
} from "@aws-cdk/aws-stepfunctions";
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
      bundling: {
        nodeModules: ["sharp"],
        externalModules: ["sharp", "aws-sdk"],
      },
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
        startingPosition: StartingPosition.TRIM_HORIZON,
      })
    );
    animeTable.grantStreamRead(animeIndexer);

    // grant lambda full operational access to table
    animeTable.grantFullAccess(animeScraper);

    // lambda function to generate anime ids
    const animeIdGenerator = new NodejsFunction(this, "animeIdGenerator", {
      entry: "lambdas/anime-id-generator/index.ts",
      handler: "handler",
      memorySize: 1024,
      timeout: Duration.seconds(30),
      functionName: "anime-id-generator",
    });

    // lambda function to generate anime ids
    const animeApiScraper = new NodejsFunction(this, "animeApiScraper", {
      entry: "lambdas/anime-api-scraper/index.ts",
      handler: "handler",
      memorySize: 1024,
      timeout: Duration.seconds(30),
      functionName: "anime-api-scraper",
    });

    // step function to process animes

    const choice = new Choice(this, "Is Valid Anime?");

    choice.when(
      Condition.isBoolean("$.Payload.title"),
      new Succeed(this, "No Id for anime")
    );

    choice.otherwise(
      new tasks.LambdaInvoke(this, "invoke-lambda scraper", {
        lambdaFunction: animeScraper,
        inputPath: "$.Payload",
      })
    );

    const mapState = new Map(this, "MapState", {
      itemsPath: "$.Payload",
    }).iterator(
      new tasks.LambdaInvoke(this, "invoke-api-scraper", {
        lambdaFunction: animeApiScraper,
      }).next(choice)
    );

    const generateIdsTask = new tasks.LambdaInvoke(this, "Generate-anime-ids", {
      lambdaFunction: animeIdGenerator,
    }).next(mapState);

    new StateMachine(this, `generate animes step function`, {
      definition: generateIdsTask,
      stateMachineType: StateMachineType.STANDARD,
      stateMachineName: `generate-animes`,
    });
  }
}
