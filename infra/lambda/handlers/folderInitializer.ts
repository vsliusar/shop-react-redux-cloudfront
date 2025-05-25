import { S3 } from "aws-sdk";
import { CloudFormationCustomResourceEvent, Context } from "aws-lambda";

const s3 = new S3();

export const handler = async (
  event: CloudFormationCustomResourceEvent,
  context: Context
) => {
  try {
    if (event.RequestType === "Delete") {
      return { PhysicalResourceId: event.PhysicalResourceId };
    }

    const bucketName = event.ResourceProperties.BucketName;
    await Promise.all([
      s3.putObject({ Bucket: bucketName, Key: "uploaded/" }).promise(),
      s3.putObject({ Bucket: bucketName, Key: "parsed/" }).promise(),
    ]);

    return { PhysicalResourceId: bucketName };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
