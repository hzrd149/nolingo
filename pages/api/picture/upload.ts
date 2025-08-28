import { db } from "@/database";
import { pictures } from "@/database/schema";
import formidable from "formidable";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import path, { join } from "path";
import sharp from "sharp";
import { authOptions } from "../auth/[...nextauth]";

/**
 * Picture upload endpoint that preserves EXIF orientation metadata
 * in thumbnails from photos taken on mobile devices. This ensures
 * thumbnails display with the correct rotation as intended by the photographer.
 */

const DATA_DIR = process.env.DATA_DIR || "./data";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the authenticated user session
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.username) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const form = formidable({
    uploadDir: join(DATA_DIR, "images"),
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  // Track created files for cleanup on failure
  const createdFiles: string[] = [];
  const cleanupFiles = () => {
    createdFiles.forEach((filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup file:", filePath, cleanupError);
      }
    });
  };

  try {
    // Ensure data/images directory exists
    const imagesDir = join(DATA_DIR, "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    const file = files.image?.[0];

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalFilename || file.newFilename;
    const extension = path.extname(originalName);
    const filename = `${timestamp}${extension}`;
    const thumbnailFilename = `thumb_${filename}`;

    // Move and rename the uploaded file
    const imagePath = path.join(imagesDir, filename);
    const thumbnailPath = path.join(imagesDir, thumbnailFilename);

    fs.renameSync(file.filepath, imagePath);
    createdFiles.push(imagePath);

    // Create thumbnail maintaining aspect ratio with max dimension of 512px
    // Use rotate() to preserve EXIF orientation metadata from mobile photos
    const image = sharp(imagePath, { failOnError: false });
    await image
      .rotate() // This automatically rotates based on EXIF orientation
      .resize(512, 512, {
        fit: "inside", // Maintains aspect ratio, fits within bounds
        withoutEnlargement: true, // Don't enlarge if image is smaller than 512px
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Get image metadata from the original file
    const imageForMetadata = sharp(imagePath, { failOnError: false });
    const metadata = await imageForMetadata.metadata();

    createdFiles.push(thumbnailPath);

    // Insert image record into database
    const [pictureRecord] = await db
      .insert(pictures)
      .values({
        original_url: `/api/picture/${filename}`,
        thumbnail_url: `/api/picture/${thumbnailFilename}`,
        file_size: file.size || 0,
        width: metadata.width || 0,
        height: metadata.height || 0,
        mime_type: metadata.format ? `image/${metadata.format}` : "image/jpeg",
        uploaded_by: parseInt(session.user.id),
        created_at: new Date().toISOString(),
      })
      .returning();

    res.status(200).json(pictureRecord);
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up any created files on failure
    cleanupFiles();

    res.status(500).json({ error: "Upload failed" });
  }
}
