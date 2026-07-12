export type UploadMethod = "photo" | "image" | "document";

export type UploadedSource = {
  method: UploadMethod;
  file: File;
};

export const maxUploadSize = 10 * 1024 * 1024;

export const documentAccept =
  ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function validateUploadFile(method: UploadMethod, file: File) {
  if (file.size > maxUploadSize) {
    return "Please choose a file under 10 MB.";
  }

  if (
    (method === "photo" || method === "image") &&
    !file.type.startsWith("image/") &&
    !/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name)
  ) {
    return "Please choose an image file.";
  }

  if (method === "document") {
    const allowedTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]);
    const allowedExtensions = /\.(pdf|doc|docx|txt)$/i;

    if (!allowedTypes.has(file.type) && !allowedExtensions.test(file.name)) {
      return "Please choose a PDF, Word, or TXT document.";
    }
  }

  return "";
}
