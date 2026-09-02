import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  resourceType?: string;
}

/**
 * Upload a file to Cloudinary.
 * Accepts a File/Blob, Buffer, ArrayBuffer, or Base64/URL string.
 */
export async function uploadFile(
  file: File | Blob | Buffer | ArrayBuffer | string,
  folder: string = "campusconnect",
  options: UploadApiOptions = {}
): Promise<UploadResult> {
  const uploadOptions: UploadApiOptions = {
    folder,
    resource_type: "auto",
    ...options,
  };

  // If string (data URI or remote URL)
  if (typeof file === "string") {
    const result: UploadApiResponse = await cloudinary.uploader.upload(file, uploadOptions);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
    };
  }

  // Convert File / Blob / ArrayBuffer to Buffer
  let buffer: Buffer;
  if (Buffer.isBuffer(file)) {
    buffer = file;
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file);
  } else if (typeof (file as Blob).arrayBuffer === "function") {
    const arrayBuffer = await (file as Blob).arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    throw new Error("Unsupported file type provided to uploadFile.");
  }

  // Upload buffer via upload_stream
  return new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed with empty result."));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          resourceType: result.resource_type,
        });
      }
    );

    stream.end(buffer);
  });
}

/**
 * Delete a previously uploaded asset from Cloudinary by public ID.
 */
export async function deleteFile(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<{ result: string }> {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
export default cloudinary;
