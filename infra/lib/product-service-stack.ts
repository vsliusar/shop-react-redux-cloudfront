import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

const LAMBDA_HANDLERS_PATH = path.join(__dirname, "../lambda/handlers");
console.log("LAMBDA_HANDLERS_PATH", LAMBDA_HANDLERS_PATH);
export class HelloLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListLambda = new lambda.Function(
      this,
      "getProductsList-lambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "getProductsList.handler",
        code: lambda.Code.fromAsset(LAMBDA_HANDLERS_PATH),
      }
    );

    const getProductsByIdLambda = new lambda.Function(
      this,
      "getProductsById-lambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "getProductsList.handler",
        code: lambda.Code.fromAsset(LAMBDA_HANDLERS_PATH),
      }
    );

    const api = new apigateway.RestApi(this, "my-product-service-api", {
      restApiName: "My Product Service API Gateway",
      description: "This API serves the Product Service Lambda functions.",
      defaultCorsPreflightOptions: {
        allowOrigins: ["https://d1myvv8fe3cilh.cloudfront.net/"],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    // Task 3.1: Create /products resource and GET method
    const productsResource = api.root.addResource("products");

    const getProductsListIntegration = new apigateway.LambdaIntegration(
      getProductsListLambda,
      {
        proxy: true,
      }
    );

    productsResource.addMethod("GET", getProductsListIntegration, {
      methodResponses: [{ statusCode: "200" }],
    });

    const productByIdResource = productsResource.addResource("{productId}");

    const getProductsByIdIntegration = new apigateway.LambdaIntegration(
      getProductsByIdLambda,
      {
        requestTemplates: {
          "application/json": `{
            "productId": "$input.params('productId')"
          }`,
        },
        integrationResponses: [
          { statusCode: "200" },
          { statusCode: "404", selectionPattern: '.*"statusCode":404.*' },
        ],
        proxy: false,
      }
    );

    productByIdResource.addMethod("GET", getProductsByIdIntegration, {
      methodResponses: [{ statusCode: "200" }, { statusCode: "404" }],
    });

    new cdk.CfnOutput(this, "ProductServiceApiUrl", {
      value: api.url,
      description: "URL of the Product Service API Gateway",
    });
  }
}
