import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_CTF_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export class StorageUploadError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StorageUploadError";
  }
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "cdctf";
  
  if (!url || !key) {
    const missing = [];
    if (!url) missing.push("SUPABASE_URL");
    if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    // Use console.warn for very early logging
    console.warn(`Supabase config missing: ${missing.join(", ")}`);
    return null;
  }
  return { url: url.replace(/\/+$/, ""), key, bucket };
}


function sanitizePathSegment(input: string) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function getLocalUploadsRoot() {
  if (process.env.LOCAL_UPLOAD_DIR) {
    return path.resolve(process.env.LOCAL_UPLOAD_DIR);
  }

  // Try common locations relative to process.cwd()
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "uploads"),
    path.join(cwd, "..", "..", "uploads"),
    path.join(cwd, "..", "uploads"),
  ];

  for (const candidate of candidates) {
    try {
      // We don't check existence here because we might want to create it,
      // but we prefer one that already exists.
      // However, if we are in the root, path.join(cwd, "uploads") is likely correct.
      // If we are in artifacts/api-server, path.join(cwd, "..", "..", "uploads") is likely correct.
      
      // Let's use a more robust detection: look for package.json or pnpm-workspace.yaml
      // to identify the root.
    } catch (e) {}
  }

  // Default fallback that is safer than going up too far
  // If we are in a subdirectory, we try to go up until we find 'uploads' or hit root.
  let current = cwd;
  while (current !== path.dirname(current)) {
    const check = path.join(current, "uploads");
    // If uploads exists in this directory, use it
    if (path.basename(current) === "api-server" && path.basename(path.dirname(current)) === "artifacts") {
        return path.resolve(current, "..", "..", "uploads");
    }
    current = path.dirname(current);
  }

  // If all else fails, just use 'uploads' in the current directory
  return path.resolve(cwd, "uploads");
}

function getLocalPublicUrl(objectName: string) {
  return `/uploads/${objectName.split("/").map(encodeURIComponent).join("/")}`;
}

export function isStorageConfigured() {
  return Boolean(getSupabaseConfig());
}

let bucketReadyPromise: Promise<void> | null = null;

async function ensureBucket() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase storage is not configured");

  if (!bucketReadyPromise) {
    bucketReadyPromise = (async () => {
      const response = await fetch(`${config.url}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.key}`,
          apikey: config.key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: config.bucket,
          name: config.bucket,
          public: true,
          file_size_limit: MAX_CTF_FILE_SIZE_BYTES,
        }),
      });

      if (response.status === 409) {
        return;
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Bucket creation failed: ${response.status} ${text}`.trim());
      }
    })().catch((error) => {
      bucketReadyPromise = null;
      throw error;
    });
  }

  await bucketReadyPromise;
}

export async function uploadBufferToStorage(params: {
  folder: "avatars" | "ctf";
  filename: string;
  contentType: string;
  buffer: Buffer;
}) {
  const config = getSupabaseConfig();
  if (!config) {
    const objectName = `${params.folder}/${randomUUID()}-${sanitizePathSegment(params.filename)}`;
    const destination = path.join(getLocalUploadsRoot(), objectName);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, params.buffer);
    return {
      path: objectName,
      publicUrl: getLocalPublicUrl(objectName),
    };
  }
  await ensureBucket();

  const objectName = `${params.folder}/${randomUUID()}-${sanitizePathSegment(params.filename)}`;
  const uploadUrl = `${config.url}/storage/v1/object/${config.bucket}/${objectName}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
      "Content-Type": params.contentType,
      "x-upsert": "true",
    },
    body: params.buffer,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new StorageUploadError(response.status, `Storage upload failed: ${response.status} ${text}`.trim());
  }

  return {
    path: objectName,
    publicUrl: `${config.url}/storage/v1/object/public/${config.bucket}/${objectName}`,
  };
}

export async function createSignedCtfUpload(params: {
  filename: string;
  size: number;
}) {
  if (!Number.isFinite(params.size) || params.size < 1) {
    throw new StorageUploadError(400, "Invalid file size");
  }
  if (params.size > MAX_CTF_FILE_SIZE_BYTES) {
    throw new StorageUploadError(413, "Uploaded file is too large for storage");
  }

  const config = getSupabaseConfig();
  if (!config) {
    throw new StorageUploadError(501, "Supabase storage is not configured");
  }

  await ensureBucket();

  const objectName = `ctf/${randomUUID()}-${sanitizePathSegment(params.filename || "challenge.bin")}`;
  const response = await fetch(`${config.url}/storage/v1/object/upload/sign/${config.bucket}/${objectName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      apikey: config.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => null) as { url?: unknown } | null;
  if (!response.ok) {
    throw new StorageUploadError(response.status, `Signed upload URL creation failed: ${response.status}`.trim());
  }

  const relativeSignedUrl = typeof data?.url === "string" ? data.url : null;
  if (!relativeSignedUrl) {
    throw new StorageUploadError(502, "Signed upload URL was not returned");
  }

  const signedUrl = relativeSignedUrl.startsWith("http")
    ? relativeSignedUrl
    : `${config.url}/storage/v1${relativeSignedUrl.startsWith("/") ? "" : "/"}${relativeSignedUrl}`;

  return {
    path: objectName,
    signedUrl,
    publicUrl: `${config.url}/storage/v1/object/public/${config.bucket}/${objectName}`,
  };
}
