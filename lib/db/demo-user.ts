import { getPrisma } from "@/lib/db/prisma";

export const demoStudentEmail = "demo-student@writinggrowth.local";

export async function getDemoStudentProfile() {
  const prisma = getPrisma();

  const user = await prisma.user.upsert({
    where: { email: demoStudentEmail },
    update: {},
    create: {
      email: demoStudentEmail,
      role: "STUDENT",
      accountProfile: {
        create: {
          parentName: "Demo Parent",
          languagePreference: "zh-CN",
        },
      },
      studentProfiles: {
        create: {
          displayName: "Demo Student",
          gradeLevel: "Grade 5",
          nativeLanguage: "zh-CN",
        },
      },
    },
    include: {
      studentProfiles: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (user.studentProfiles[0]) {
    return user.studentProfiles[0];
  }

  return prisma.studentProfile.create({
    data: {
      userId: user.id,
      displayName: "Demo Student",
      gradeLevel: "Grade 5",
      nativeLanguage: "zh-CN",
    },
  });
}
