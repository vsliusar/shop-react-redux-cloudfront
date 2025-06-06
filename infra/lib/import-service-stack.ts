import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as s3n from "aws-cdk-lib/aws-lambda-event-sources";
import { join } from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { IQueue } from "aws-cdk-lib/aws-sqs";

interface ImportServiceStackProps extends cdk.StackProps {
  catalogItemsQueue: IQueue;
}

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "ImportServiceBucket", {
      bucketName: `import-service-bucket-${this.account}-4`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ["https://d204cu7nba40yp.cloudfront.net"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
          ],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
        },
      ],
    });

    const importProductsFileLambda = new NodejsFunction(
      this,
      "ImportProductsFileLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/importProductsFile.ts"),
        functionName: "importProductsFileLambda",
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    bucket.grantReadWrite(importProductsFileLambda);

    const api = new apigateway.RestApi(this, "ImportServiceAPI", {
      restApiName: "Import Service API",
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileLambda)
    );

    importResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    });

    const importFileParserLambda = new NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/importFileParser.ts"),
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      }
    );

    bucket.grantReadWrite(importFileParserLambda);

    importFileParserLambda.addEventSource(
      new s3n.S3EventSource(bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: "uploaded/" }],
      })
    );

    const catalogItemsQueue = props.catalogItemsQueue;
    importFileParserLambda.addEnvironment(
      "CATALOG_ITEMS_QUEUE_URL",
      catalogItemsQueue.queueUrl
    );
    catalogItemsQueue.grantSendMessages(importFileParserLambda);
  }
}
