import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { createSignedUploadUrl } from "@/lib/upload/upload-storage";

type UploadDownloadRouteProps = {
  params: Promise<{
    uploadId: string;
  }>;
};

export async function GET(_request: Request, { params }: UploadDownloadRouteProps) {
  try {
    const { uploadId } = await params;
    const student = await requireCurrentStudentProfile();
    const upload = await getPrisma().uploadAsset.findFirst({
      where: {
        id: uploadId,
        submission: {
          studentId: student.id,
        },
      },
      select: {
        storagePath: true,
      },
    });

    if (!upload) {
      return NextResponse.json({ message: "Upload not found." }, { status: 404 });
    }

    if (upload.storagePath.startsWith("pending-storage/")) {
      return NextResponse.json({ message: "This upload is not stored in object storage yet." }, { status: 404 });
    }

    const signedUrl = await createSignedUploadUrl(upload.storagePath);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
