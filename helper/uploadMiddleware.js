import multer from "multer";
import s3 from "./aws.js";
import dotenv from "dotenv";
dotenv.config();

export const uploadFileToS3 = (fieldName, bucketName, folder = false) => {
  const storage = multer.memoryStorage(); // Store files in memory
  const upload = multer({ storage });

  return (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).send("Error uploading file.");
      }
      if (!req.file) {
        next();
      } else {
        const partision = folder ? `${folder}/` : "";
        // Create S3 upload parameters
        const params = {
          Bucket: bucketName,
          Key: `${partision}${Date.now().toString()}-${req.file.originalname}`, // S3 file key
          Body: req.file.buffer, // File data
          ContentType: req.file.mimetype, // File MIME type
          ACL: "public-read", // Optional: file permissions
        };

        try {
          // Upload the file to S3
          const data = await s3.upload(params).promise();
          req.fileLocation = data.Location; // Add S3 file URL to request
          next(); // Proceed to the next middleware or route handler
        } catch (uploadErr) {
          console.error("Error uploading file to S3:", uploadErr);
          res.status(500).send("Error uploading file to S3.");
        }
      }
    });
  };
};

export const deleteFileFromS3 = async (bucketName, fileKey) => {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
};
