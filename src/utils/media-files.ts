import fs from "node:fs";
import path from "node:path";

type MediaFolder = "albums" | "avatars" | "posts" | "signatures" | "messages";

const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp);base64,/i;
const MEDIA_ROOT = path.resolve(process.cwd(), "media");
const PROTECTED_MEDIA_PATHS = new Set(["/media/avatars/default_avatar.png"]);

export const DEFAULT_AVATAR_PATH = "/media/avatars/default_avatar.png";
export const SIGNATURE_MEDIA_PATH = "/media/signatures";

const safeSegment = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

export const isDataUriImage = (value?: string | null): value is string =>
    typeof value === "string" && IMAGE_DATA_URI_REGEX.test(value);

const normalizePublicMediaPath = (value?: string | null): string | null => {
    if (!value || value.startsWith("data:") || value.startsWith("file:")) {
        return null;
    }

    let publicPath = value.trim();

    try {
        publicPath = new URL(publicPath).pathname;
    } catch {
        // Local media paths are not full URLs.
    }

    publicPath = publicPath.split("?")[0]?.split("#")[0] ?? publicPath;

    try {
        publicPath = decodeURIComponent(publicPath);
    } catch {
        return null;
    }

    return publicPath.startsWith("/media/") ? publicPath : null;
};

const getMediaFilePath = (value?: string | null): string | null => {
    const publicPath = normalizePublicMediaPath(value);
    if (!publicPath || PROTECTED_MEDIA_PATHS.has(publicPath)) return null;

    const relativePath = publicPath.replace(/^\/media\//, "");
    const filePath = path.resolve(MEDIA_ROOT, relativePath);

    return filePath.startsWith(`${MEDIA_ROOT}${path.sep}`) ? filePath : null;
};

export const saveDataUriImage = (
    value: string,
    folder: MediaFolder,
    prefix: string,
    index?: number,
): string => {
    if (!IMAGE_DATA_URI_REGEX.test(value)) return value;

    const mimeType = (value.match(IMAGE_DATA_URI_REGEX)?.[1] ?? "jpg").toLowerCase();
    const extension = mimeType === "jpeg" ? "jpg" : mimeType;
    const base64Data = value.replace(/^data:image\/\w+;base64,/i, "");
    const dir = path.join(MEDIA_ROOT, folder);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const suffix = index === undefined ? "" : `_${index}`;
    const random = Math.random().toString(36).slice(2, 8);
    const fileName = `${safeSegment(prefix)}_${Date.now()}${suffix}_${random}.${extension}`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    return `/media/${folder}/${fileName}`;
};

export const getSignatureFileName = (value?: string | null): string | null => {
    if (!value || value.startsWith("data:") || value.startsWith("file:")) return null;

    const publicPath = normalizePublicMediaPath(value);
    const rawPath = publicPath ?? value.trim();
    const withoutQuery = rawPath.split("?")[0]?.split("#")[0] ?? rawPath;
    let decodedPath = withoutQuery;

    try {
        decodedPath = decodeURIComponent(withoutQuery);
    } catch {
        return null;
    }

    const fileName = path.basename(decodedPath);
    if (!fileName || fileName === "." || fileName === "..") return null;

    return /^[a-zA-Z0-9_.-]+$/.test(fileName) ? fileName : null;
};

export const signatureFileNameToPublicPath = (value?: string | null): string | null => {
    const fileName = getSignatureFileName(value);
    return fileName ? `${SIGNATURE_MEDIA_PATH}/${fileName}` : null;
};

export const saveSignatureImage = (value: string | null | undefined, prefix: string): string | null => {
    if (!value) return null;

    if (isDataUriImage(value)) {
        const publicPath = saveDataUriImage(value, "signatures", prefix);
        return getSignatureFileName(publicPath);
    }

    return getSignatureFileName(value);
};

export const deleteSignatureFile = (value?: string | null) => {
    const publicPath = signatureFileNameToPublicPath(value);
    if (publicPath) deleteMediaFile(publicPath);
};

export const deleteMediaFile = (value?: string | null) => {
    const filePath = getMediaFilePath(value);
    if (!filePath) return;

    try {
        fs.rmSync(filePath, { force: true });
    } catch (error) {
        console.error("Error deleting media file:", error);
    }
};

export const deleteMediaFiles = (values: Array<string | null | undefined>) => {
    const uniqueValues = Array.from(new Set(values.filter(Boolean)));
    uniqueValues.forEach((value) => deleteMediaFile(value));
};
