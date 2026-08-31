// Batas ukuran gambar sebelum di-encode base64 (agar dokumen MongoDB tidak membengkak, batas BSON 16MB)
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

export function isValidBase64Image(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return false;

  const [, mime, base64Data] = match;
  if (!ALLOWED_MIME.includes(mime)) return false;

  const approxBytes = base64Data.length * 0.75;
  if (approxBytes > MAX_IMAGE_BYTES) return false;

  return true;
}
