import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios, { AxiosResponse } from "axios";

type CSVFileImportProps = Readonly<{
  url: string;
  title: string;
}>;

interface PresignedUrlResponse {
  url: string;
}

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    if (!file) return;

    try {
      console.log("uploadFile to", url);

      const response: AxiosResponse<PresignedUrlResponse> = await axios({
        method: "GET",
        url,
        params: {
          name: encodeURIComponent(file.name),
        },
      });

      console.log("File to upload: ", file.name);
      console.log("Uploading to: ", response.data.url);

      const result = await axios.put(response.data.url, file, {
        headers: {
          "Content-Type": "text/csv",
        },
      });

      if (result.status !== 200) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      console.log("Result: ", result);
      setFile(undefined);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
