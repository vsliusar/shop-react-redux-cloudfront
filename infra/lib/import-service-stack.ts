import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { join } from "path";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for import service
    const importBucket = new s3.Bucket(this, "import-service-bucket", {
      bucketName: `import-service-bucket-${this.account}`,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Initialize folder structure with empty objects using a custom resource
    new cdk.CustomResource(this, "InitializeFolders", {
      serviceToken: new NodejsFunction(this, "FolderInitializer", {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/folderInitializer.ts"),
        bundling: {
          minify: true,
          sourceMap: true,
        },
      }).functionArn,
      properties: {
        BucketName: importBucket.bucketName,
        Version: Date.now().toString(), // Force update if redeployed
      },
    });

    // Create Lambda function
    const importProductsFileLambda = new NodejsFunction(
      this,
      "import-products-file",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/importProductsFile.ts"),
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
        initialPolicy: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:PutObject", "s3:GetObject"],
            resources: [`${importBucket.bucketArn}/*`],
          }),
        ],
      }
    );

    const importFileParserLambda = new NodejsFunction(
      this,
      "import-file-parser",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(30),
        handler: "handler",
        entry: join(__dirname, "../lambda/handlers/importFileParser.ts"),
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
        initialPolicy: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            resources: [`${importBucket.bucketArn}/*`],
          }),
        ],
      }
    );

    // Grant S3 permissions to Lambda
    importBucket.grantPut(importProductsFileLambda);
    importBucket.grantRead(importProductsFileLambda);

    // Grant S3 permissions
    importBucket.grantRead(importFileParserLambda);
    importBucket.grantWrite(importFileParserLambda);
    importBucket.grantDelete(importFileParserLambda);

    // Add S3 notification for uploaded folder
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserLambda),
      { prefix: "uploaded/" }
    );

    // Create API Gateway
    const api = new apigateway.RestApi(this, "import-api", {
      restApiName: "Import Service",
      description: "This API handles import operations",
    });

    // Create import resource and method
    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileLambda),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      }
    );

    // Add CORS support
    importResource.addCorsPreflight({
      allowOrigins: ["*"],
      allowMethods: ["GET"],
      allowHeaders: ["Content-Type", "Authorization"],
    });
  }
}
