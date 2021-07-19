import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import { Construct, SecretValue, Stack, StackProps } from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { PourOverInfraStage } from "./stage";

/**
 * The stack that defines the application pipeline
 */
export class Pipeline extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, "PourOverLabsPipeline", {
      // The pipeline name
      pipelineName: "AnimeApp",
      cloudAssemblyArtifact,

      // Where the source can be found
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: "GitHub",
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager("gh", {
          jsonField: "github",
        }),
        branch: "main",
        owner: "anify-app",
        repo: "anify-infra",
      }),

      // How it will be built and synthesized
      synthAction: SimpleSynthAction.standardNpmSynth({
        environment: { privileged: true },
        sourceArtifact,
        cloudAssemblyArtifact,
      }),
    });

    // add the application deployments

    pipeline.addApplicationStage(
      new PourOverInfraStage(this, "beta", {
        env: { account: this.account, region: this.region },
      })
    );
  }
}
