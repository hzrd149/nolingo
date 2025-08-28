import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "data";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: imagePath } = req.query;
  const filename = Array.isArray(imagePath) ? imagePath.join("/") : imagePath;
  if (!filename) return res.status(404).json({ error: "Image not found" });

  const filePath = path.join(DATA_DIR, "images", filename);

  // Check if file exists
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "Image not found" });

  // Get file stats to check if it's a file
  const stats = fs.statSync(filePath);
  if (!stats.isFile())
    return res.status(404).json({ error: "Image not found" });

  // Determine content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };

  const contentType =
    contentTypeMap[ext as keyof typeof contentTypeMap] ||
    "application/octet-stream";

  // Set headers
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
