import { Stack, StackProps, pipelines } from "aws-cdk-lib";
import { App, aws_codebuild } from "aws-cdk-lib";

import { PourOverInfraStage } from "./stage";

/**
 * The stack that defines the application pipeline
 */
export class Pipeline extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, "PourOverLabsPipeline", {
      // The pipeline name
      pipelineName: "AnimeApp",
      codeBuildDefaults: {
        buildEnvironment: {
          privileged: true,
          buildImage: aws_codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        },
      },
      synth: new pipelines.ShellStep("Synth", {
        // Use a connection created using the AWS console to authenticate to GitHub
        // Other sources are available.
        input: pipelines.CodePipelineSource.connection(
          "anify-app/anify-infra",
          "main",
          {
            connectionArn:
              "arn:aws:codestar-connections:us-east-1:153676263714:connection/e84b06db-e4f7-4415-b916-943561c5b217", // Created using the AWS console * });',
          }
        ),
        commands: ["npm i npm -g", "npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // add the application deployments

    pipeline.addStage(
      new PourOverInfraStage(this, "beta", {
        env: { account: this.account, region: this.region },
      })
    );
  }
}
