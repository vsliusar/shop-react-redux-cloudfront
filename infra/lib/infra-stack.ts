import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DeploymentService } from "./deployment-service";
import { ProductServiceStack } from "./product-service-stack";

export class DeployWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DeploymentService(this, "deployment");
    new ProductServiceStack(this, "product-service-lambda-stack");
  }
}
