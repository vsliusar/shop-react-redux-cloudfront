#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DeployWebAppStack } from "../lib/infra-stack";
import { ProductServiceStack } from "../lib/product-service-stack";
import { ImportServiceStack } from "../lib/import-service-stack";
import { AuthorizationServiceStack } from "../lib/authorization-service-stack";
import { ImportApiGatewayStack } from "../lib/import-api-gateway";

const app = new cdk.App();
new DeployWebAppStack(app, "DeployWebAppStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
const productServiceStack = new ProductServiceStack(
  app,
  "product-service-lambda-stack",
  {
    env: { region: "us-east-1" },
  }
);
new AuthorizationServiceStack(app, "AuthorizationServiceStack");
const importServiceStack = new ImportServiceStack(
  app,
  "import-service-s3-stack-4",
  {
    catalogItemsQueue: productServiceStack.catalogItemsQueue,
    env: { region: "us-east-1" },
  }
);
const importApiGatewayStack = new ImportApiGatewayStack(
  app,
  "ImportApiGatewayStack",
  {
    env: { region: "us-east-1" },
  }
);
// Add dependency to ensure ImportServiceStack is deployed first
importApiGatewayStack.addDependency(importServiceStack);
