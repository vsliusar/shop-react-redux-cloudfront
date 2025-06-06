import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import * as dotenv from "dotenv";
import { CfnOutput } from "aws-cdk-lib";

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizerLambda = new NodejsFunction(
      this,
      "BasicAuthorizerLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/basicAuthorizer.ts"),
        functionName: "basicAuthorizerLambda",
        environment: {
          [process.env.GITHUB_USERNAME!]: process.env.GITHUB_PASSWORD!,
        },
      }
    );

    new CfnOutput(this, "BasicAuthorizerLambdaArn", {
      value: basicAuthorizerLambda.functionArn,
      exportName: "BasicAuthorizerLambdaArn",
    });
  }
}
