import { prisma } from "@/lib/db/prisma";

export const demoStudentEmail = "demo-student@writinggrowth.local";

export async function getDemoStudentProfile() {
  const user = await prisma.user.upsert({
    where: { email: demoStudentEmail },
    update: {},
    create: {
      email: demoStudentEmail,
      role: "STUDENT",
      studentProfile: {
        create: {
          displayName: "Demo Student",
          gradeLevel: "Grade 5",
          nativeLanguage: "zh-CN",
        },
      },
    },
    include: {
      studentProfile: true,
    },
  });

  if (user.studentProfile) {
    return user.studentProfile;
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
