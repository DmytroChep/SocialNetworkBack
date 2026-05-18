import fs from "node:fs";
import path from "node:path";

type MediaFolder = "albums" | "avatars" | "posts";

const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpg|jpeg);base64,/;
const MEDIA_ROOT = path.resolve(process.cwd(), "media");
const PROTECTED_MEDIA_PATHS = new Set(["/media/avatars/default_avatar.png"]);

export const DEFAULT_AVATAR_PATH = "/media/avatars/default_avatar.png";

const safeSegment = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

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

    const mimeType = value.match(IMAGE_DATA_URI_REGEX)?.[1] ?? "jpg";
    const extension = mimeType === "jpeg" ? "jpg" : mimeType;
    const base64Data = value.replace(/^data:image\/\w+;base64,/, "");
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
