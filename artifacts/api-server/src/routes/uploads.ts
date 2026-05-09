import { Router } from "express";
import multer from "multer";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { uploadBufferToStorage } from "../lib/storage";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

router.post("/ctf-file", authenticateToken, requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const result = await uploadBufferToStorage({
    folder: "ctf",
    filename: req.file.originalname || "challenge.bin",
    contentType: req.file.mimetype || "application/octet-stream",
    buffer: req.file.buffer,
  });

  res.status(201).json({ fileUrl: result.publicUrl, path: result.path });
});

export default router;
