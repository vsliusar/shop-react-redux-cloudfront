import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class ImportApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, "ImportServiceAPI", {
      restApiName: "Import Service API",
    });

    const authorizerLambdaArn = cdk.Fn.importValue("BasicAuthorizerLambdaArn");

    const authorizerFn = lambda.Function.fromFunctionAttributes(
      this,
      "AuthorizerFunction",
      {
        functionArn: authorizerLambdaArn,
        sameEnvironment: true,
      }
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "ImportAuthorizer",
      {
        handler: authorizerFn,
        identitySource: "method.request.header.Authorization",
        resultsCacheTtl: cdk.Duration.seconds(0),
      }
    );

    const importResource = api.root.addResource("import");

    const importLambda = lambda.Function.fromFunctionAttributes(
      this,
      "ImportProductsFileLambda",
      {
        functionArn:
          "arn:aws:lambda:us-east-1:956541543763:function:importProductsFileLambda",
        sameEnvironment: true,
      }
    );

    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importLambda),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );

    // CORS preflight: no authorizer!
    importResource.addMethod(
      "OPTIONS",
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers":
                "'Content-Type,Authorization'",
              "method.response.header.Access-Control-Allow-Origin": "'*'",
              "method.response.header.Access-Control-Allow-Methods":
                "'GET,OPTIONS'",
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: { "application/json": '{"statusCode": 200}' },
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Origin": true,
              "method.response.header.Access-Control-Allow-Methods": true,
            },
          },
        ],
        authorizationType: apigateway.AuthorizationType.NONE,
      }
    );
  }
}
