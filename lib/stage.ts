import { CfnOutput, Stage, App, StageProps } from "aws-cdk-lib";
import { PouroverInfraStack } from "./pourover-infra-stack";

/**
 * Deployable unit of service
 */
export class PourOverInfraStage extends Stage {
  public readonly urlOutput: CfnOutput;

  constructor(scope: any, id: string, props: StageProps) {
    super(scope, id, props);

    new PouroverInfraStack(this, `PourOverInfraStackStage`);
  }
}
