type UploadFileToStorageInput = {
  file: File;
  storagePath: string;
};

function getSupabaseStorageConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "writing-uploads";

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    bucket,
    serviceRoleKey,
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
  };
}

export function isObjectStorageConfigured() {
  return Boolean(getSupabaseStorageConfig());
}

export function buildPendingStoragePath({
  fileName,
  studentId,
}: {
  fileName: string;
  studentId: string;
}) {
  return `pending-storage/${studentId}/${Date.now()}-${sanitizeStorageName(fileName)}`;
}

export function buildStoredUploadPath({
  fileName,
  studentId,
}: {
  fileName: string;
  studentId: string;
}) {
  return `student-uploads/${studentId}/${Date.now()}-${sanitizeStorageName(fileName)}`;
}

export function sanitizeStorageName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "uploaded-writing";
}

export async function uploadFileToConfiguredStorage({
  file,
  storagePath,
}: UploadFileToStorageInput) {
  const config = getSupabaseStorageConfig();

  if (!config) {
    return {
      storagePath,
      stored: false,
    };
  }

  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/${config.bucket}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false",
      },
      body: await file.arrayBuffer(),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Unable to store the uploaded file.");
  }

  return {
    storagePath,
    stored: true,
  };
}

export async function createSignedUploadUrl(storagePath: string, expiresIn = 300) {
  const config = getSupabaseStorageConfig();

  if (!config) {
    throw new Error("Object storage is not configured.");
  }

  const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/sign/${config.bucket}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Unable to create a signed upload URL.");
  }

  const result = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = result.signedURL ?? result.signedUrl;

  if (!signedPath) {
    throw new Error("Storage did not return a signed URL.");
  }

  return signedPath.startsWith("http") ? signedPath : `${config.supabaseUrl}${signedPath}`;
}
