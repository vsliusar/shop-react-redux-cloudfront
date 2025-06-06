import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { join } from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

export class ProductServiceStack extends cdk.Stack {
  public readonly catalogItemsQueue: Queue;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableArn(
      this,
      "products",
      `arn:aws:dynamodb:${this.region}:${this.account}:table/products`
    );
    const stockTable = dynamodb.Table.fromTableArn(
      this,
      "stock",
      `arn:aws:dynamodb:${this.region}:${this.account}:table/stock`
    );

    const api = new apigateway.RestApi(this, "product-api", {
      restApiName: "Product Service",
      description: "This API handles product requests.",
    });

    const getProductsListLambda = new NodejsFunction(
      this,
      "get-products-list",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/getProductsList.ts"),
        environment: {
          PRODUCTS_TABLE: productsTable.tableName,
          STOCK_TABLE: stockTable.tableName,
          AWS_NODE_JS_CONNECTION_REUSE_ENABLED: "1",
        },
      }
    );

    getProductsListLambda.addPermission("apigateway-invoke", {
      principal: new cdk.aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/prod/products/available`,
    });

    productsTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductsListLambda);

    const getProductByIdLambda = new NodejsFunction(this, "get-product-by-id", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "handler",
      entry: join(__dirname, "../lambda/handlers/getProductById.ts"),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCK_TABLE: stockTable.tableName,
        AWS_NODE_JS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    getProductByIdLambda.addPermission("apigateway-invoke", {
      principal: new cdk.aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/prod/products/*`,
    });

    productsTable.grantReadData(getProductByIdLambda);
    stockTable.grantReadData(getProductByIdLambda);

    const createProductLambda = new NodejsFunction(this, "create-product", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "handler",
      entry: join(__dirname, "../lambda/handlers/createProduct.ts"),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCK_TABLE: stockTable.tableName,
        AWS_NODE_JS_CONNECTION_REUSE_ENABLED: "1",
      },
    });

    createProductLambda.addPermission("apigateway-invoke", {
      principal: new cdk.aws_iam.ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/prod/products/*`,
    });

    productsTable.grantWriteData(createProductLambda);
    stockTable.grantWriteData(createProductLambda);

    const productResource = api.root.addResource("products");
    productResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductLambda, {
        proxy: true,
      }),
      {
        methodResponses: [
          { statusCode: "201" },
          { statusCode: "400" },
          { statusCode: "500" },
        ],
      }
    );

    productResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["POST"],
      allowHeaders: ["Content-Type", "Authorization"],
    });

    const productListResource = productResource.addResource("available");

    productListResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsListLambda, {
        proxy: true,
        integrationResponses: [{ statusCode: "200" }],
      }),
      {
        methodResponses: [{ statusCode: "200" }, { statusCode: "500" }],
      }
    );

    productListResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    });

    const productByIdResource = productResource.addResource("{productId}");

    productByIdResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductByIdLambda, {
        proxy: true,
        integrationResponses: [{ statusCode: "200" }],
      }),
      {
        methodResponses: [
          { statusCode: "200" },
          { statusCode: "404" },
          { statusCode: "500" },
        ],
      }
    );

    productByIdResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
    });

    this.catalogItemsQueue = new Queue(this, "CatalogItemsQueue", {
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const catalogBatchProcessLambda = new NodejsFunction(
      this,
      "CatalogBatchProcessLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/catalogBatchProcess.ts"),
        functionName: "catalogBatchProcessLambda",
        environment: {
          PRODUCTS_TABLE: "products",
          STOCK_TABLE: "stock",
        },
      }
    );

    productsTable.grantWriteData(catalogBatchProcessLambda);
    stockTable.grantWriteData(catalogBatchProcessLambda);

    catalogBatchProcessLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(this.catalogItemsQueue, {
        batchSize: 5,
      })
    );

    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "create-product-topic",
    });

    createProductTopic.addSubscription(
      new subs.EmailSubscription("mzgme23@gmail.com")
    );

    catalogBatchProcessLambda.addEnvironment(
      "CREATE_PRODUCT_TOPIC_ARN",
      createProductTopic.topicArn
    );

    createProductTopic.grantPublish(catalogBatchProcessLambda);
  }
}
