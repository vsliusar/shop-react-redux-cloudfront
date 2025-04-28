import { Stack, type StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DeploymentService } from "./deployment-service";
import { HelloLambdaStack } from "./product-service-stack";

export class DeployWebAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new DeploymentService(this, "deployment");
    new HelloLambdaStack(this, "lambda-test-service");
  }
}
