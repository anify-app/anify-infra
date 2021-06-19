import * as cdk from "@aws-cdk/core";
import { AttributeType, BillingMode, Table } from "@aws-cdk/aws-dynamodb";
import { Duration } from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";

export class PouroverInfraStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // lambda function
    const animeScraper = new NodejsFunction(this, "AnimeScraper", {
      entry: "lambdas/anime-scraper/index.ts",
      handler: "handler",
      memorySize: 1024,
      timeout: Duration.seconds(30),
      functionName: "anime-scraper",
    });

    // dynamodb table Single Table Design
    const table = new Table(this, "AnimeDB", {
      tableName: "anime",
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
    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      sortKey: { name: "GSI1SK", type: AttributeType.STRING },
      partitionKey: { name: "GSI1PK", type: AttributeType.STRING },
    });

    table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      sortKey: { name: "GSI2SK", type: AttributeType.STRING },
      partitionKey: { name: "GSI2PK", type: AttributeType.STRING },
    });

    // grant lambda full operational access to table
    table.grantReadWriteData(animeScraper);
  }
}
