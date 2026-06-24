import { v2 as cloudinary } from "cloudinary";
import path from "node:path";

type MediaFolder =
  | "media/profile_app/albums"
  | "media/profile_app/avatars"
  | "media/profile_app/signatures"
  | "media/chat_app/group_avatars"
  | "media/chat_app/message_images"
  | "media/post_app/original_images"
  | "media/post_app/compressed_images";

const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp);base64,/i;

// В media-files.ts
const CLOUDINARY_BASE = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

export const getMediaUrl = (value?: string | null): string | null => {
  if (!value) return null;
  
  // Вже повний URL (старі записи або default avatar)
  if (value.startsWith("http")) return value;
  
  // public_id → повний URL
  return `${CLOUDINARY_BASE}/${value}`;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // ← добавь, 60 секунд
});

const safeSegment = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

export const DEFAULT_AVATAR_PATH = "media/profile_app/avatars/default_avatar";
export const SIGNATURE_MEDIA_PATH = "media/profile_app/signatures";

export const isDataUriImage = (value?: string | null): value is string =>
  typeof value === "string" && IMAGE_DATA_URI_REGEX.test(value);

// ─── Upload ────────────────────────────────────────────────────────────────

export const saveDataUriImage = async (
  value: string,
  folder: MediaFolder,
  prefix: string,
  index?: number,
): Promise<string> => {
  if (!IMAGE_DATA_URI_REGEX.test(value)) return value;

  const suffix = index === undefined ? "" : `_${index}`;
  const random = Math.random().toString(36).slice(2, 8);
  const public_id = `${safeSegment(prefix)}_${Date.now()}${suffix}_${random}`;

  await cloudinary.uploader.upload(value, {
    folder,
    public_id,
    overwrite: false,
    resource_type: "image",
  });

  // ✅ Повертаємо тільки public_id, а не повний URL
  return `${folder}/${public_id}`;
};

// ─── Signatures ────────────────────────────────────────────────────────────

export const getSignatureFileName = (value?: string | null): string | null => {
  if (!value || value.startsWith("data:") || value.startsWith("file:")) return null;

  try {
    // Витягуємо public_id з Cloudinary URL або залишаємо як є
    const url = new URL(value);
    const parts = url.pathname.split("/upload/")[1];
    return parts ?? null;
  } catch {
    // Не URL — повертаємо як є якщо валідне ім'я
    const fileName = path.basename(value);
    return /^[a-zA-Z0-9_.\-/]+$/.test(fileName) ? fileName : null;
  }
};

export const signatureFileNameToPublicPath = (value?: string | null): string | null => {
  const fileName = getSignatureFileName(value);
  return fileName ? `${SIGNATURE_MEDIA_PATH}/${fileName}` : null;
};

export const saveSignatureImage = async (
  value: string | null | undefined,
  prefix: string,
): Promise<string | null> => {
  if (!value) return null;

  if (isDataUriImage(value)) {
    const url = await saveDataUriImage(value, "media/profile_app/signatures", prefix);
    return getSignatureFileName(url);
  }

  return getSignatureFileName(value);
};

// ─── Delete ────────────────────────────────────────────────────────────────

/**
 * Витягує public_id з Cloudinary URL.
 * https://res.cloudinary.com/mycloud/image/upload/v123/avatars/avatar_1.jpg
 * → "avatars/avatar_1"
 */
const extractPublicId = (value?: string | null): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);
    // Після /upload/ може бути версія типу v1234567890/
    const afterUpload = url.pathname.split("/upload/")[1];
    if (!afterUpload) return null;

    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    // Прибираємо розширення (.jpg, .png, etc.)
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

export const deleteMediaFile = async (value?: string | null): Promise<void> => {
  if (!value) return;
  
  const publicId = value.startsWith("http") 
    ? extractPublicId(value)   // існуюча функція
    : value.replace(/\.[^/.]+$/, ""); // прибираємо розширення якщо є
    
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting media file from Cloudinary:", error);
  }
};

export const deleteMediaFiles = async (
  values: Array<string | null | undefined>,
): Promise<void> => {
  const uniqueValues = Array.from(new Set(values.filter(Boolean))) as string[];
  const publicIds = uniqueValues.map(extractPublicId).filter(Boolean) as string[];

  if (!publicIds.length) return;

  try {
    // Cloudinary дозволяє видаляти до 100 за раз
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error("Error deleting media files from Cloudinary:", error);
  }
};

export const deleteSignatureFile = async (value?: string | null): Promise<void> => {
  await deleteMediaFile(value);
};