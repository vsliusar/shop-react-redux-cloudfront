import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import csv from "csv-parser";

const s3 = new S3Client({ region: "us-east-1" });

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const srcKey = decodeURIComponent(record.s3.object.key);
      const dirKey = srcKey.replace(/^uploaded\//, "parsed/");

      console.log(`Parsing ${bucket}/${srcKey}`);

      const { Body } = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: srcKey })
      );

      if (!Body || typeof (Body as any).pipe !== "function") {
        throw new Error("S3 object Body is not a readable stream");
      }

      await new Promise<void>((resolve, reject) => {
        (Body as Readable)
          .pipe(csv())
          .on("data", (row: any) => console.log("CSV row:", row))
          .on("end", resolve)
          .on("error", reject);
      });

      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${srcKey}`,
          Key: dirKey,
        })
      );
      console.log(`Copied to ${dirKey}`);

      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: srcKey }));
      console.log(`Deleted  ${srcKey}`);
    } catch (error) {
      console.error("Error processing record:", error);
      // Optionally, rethrow or handle error as needed
      throw error;
    }
  }
};
