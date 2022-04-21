import {
  aws_dynamodb,
  aws_lambda_nodejs,
  aws_lambda,
  Duration,
  SecretValue,
  App,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import {
  Map,
  StateMachine,
  StateMachineType,
} from "aws-cdk-lib/aws-stepfunctions";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { SfnStateMachine } from "aws-cdk-lib/aws-events-targets";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export class PouroverInfraStack extends Stack {
  constructor(scope: any, id: string, props?: StackProps) {
    super(scope, id, props);

    // dynamodb table Single Table Design
    const animeTable = new aws_dynamodb.Table(this, "AnimeDB", {
      tableName: "anime",
      stream: aws_dynamodb.StreamViewType.NEW_IMAGE,
      partitionKey: {
        name: "PK",
        type: aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: aws_dynamodb.AttributeType.STRING,
      },
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    animeTable.addGlobalSecondaryIndex({
      indexName: "GSI1",

      partitionKey: { name: "GSI1PK", type: aws_dynamodb.AttributeType.STRING },
    });

    animeTable.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: { name: "GSI2PK", type: aws_dynamodb.AttributeType.STRING },
    });

    // dynamodb table Single Table Design
    const tasksTable = new aws_dynamodb.Table(this, "AnimeTasks", {
      tableName: "anime-tasks",
      stream: aws_dynamodb.StreamViewType.NEW_IMAGE,
      partitionKey: {
        name: "PK",
        type: aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: aws_dynamodb.AttributeType.STRING,
      },
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    // lambda function to scrape anime
    const animeScraper = new aws_lambda_nodejs.NodejsFunction(
      this,
      "AnimeScraper",
      {
        entry: "lambdas/anime-scraper/index.ts",
        handler: "handler",
        memorySize: 2048,
        timeout: Duration.seconds(180),
        functionName: "anime-scraper",
        bundling: {
          nodeModules: ["sharp", "get-image-colors"],
          externalModules: ["sharp", "aws-sdk"],
        },
      }
    );
    // lambda function to generate anime ids
    const animeApiScraper = new aws_lambda_nodejs.NodejsFunction(
      this,
      "animeApiScraper",
      {
        entry: "lambdas/anime-api-scraper/index.ts",
        handler: "handler",
        memorySize: 10240,
        timeout: Duration.seconds(180),
        functionName: "anime-api-scraper",
        environment: {
          ANIME_SCRAPER: animeScraper.functionName,
        },
        bundling: {
          nodeModules: ["sharp", "get-image-colors"],
          externalModules: ["sharp", "aws-sdk"],
        },
      }
    );

    // lambda function to index anime
    const animeIndexer = new aws_lambda_nodejs.NodejsFunction(
      this,
      "AnimeIndexer",
      {
        entry: "lambdas/anime-indexer/index.ts",
        handler: "handler",
        memorySize: 4096,
        timeout: Duration.seconds(120),
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
      }
    );

    animeIndexer.addEventSource(
      new DynamoEventSource(animeTable, {
        startingPosition: aws_lambda.StartingPosition.TRIM_HORIZON,
      })
    );
    animeTable.grantStreamRead(animeIndexer);

    // grant lambda full operational access to table
    animeTable.grantFullAccess(animeScraper);

    // grant lambda full operational access to table
    animeTable.grantFullAccess(animeApiScraper);
    // lambda function to generate anime ids
    const animeIdGenerator = new aws_lambda_nodejs.NodejsFunction(
      this,
      "animeIdGenerator",
      {
        entry: "lambdas/anime-id-generator/index.ts",
        handler: "handler",
        memorySize: 1024,
        timeout: Duration.seconds(120),
        functionName: "anime-id-generator",
      }
    );

    animeApiScraper.addToRolePolicy(
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [animeScraper.functionArn],
      })
    );

    tasksTable.grantFullAccess(animeIdGenerator);
    // step function to process animes

    const mapState = new Map(this, "MapState", {
      maxConcurrency: 1,
      itemsPath: "$.Payload",
    }).iterator(
      new LambdaInvoke(this, "invoke-api-scraper", {
        lambdaFunction: animeApiScraper,
      })
    );

    const generateIdsTask = new LambdaInvoke(this, "Generate-anime-ids", {
      lambdaFunction: animeIdGenerator,
    }).next(mapState);

    const animeScraperStateMachine = new StateMachine(
      this,
      `generate animes step function`,
      {
        definition: generateIdsTask,
        stateMachineType: StateMachineType.STANDARD,
        stateMachineName: `generate-animes`,
      }
    );
    const stateMachineTarget = new SfnStateMachine(animeScraperStateMachine);

    new Rule(this, "AnimeScraperCron", {
      schedule: Schedule.rate(Duration.minutes(5)),
      targets: [stateMachineTarget],
    });
  }
}
