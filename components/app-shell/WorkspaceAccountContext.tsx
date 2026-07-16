"use client";

import { createContext, type CSSProperties, type ReactNode, useContext } from "react";

export type WorkspaceStudent = {
  id: string;
  displayName: string;
  themeColor: string;
};

type WorkspaceAccountContextValue = {
  currentStudentId: string;
  email: string;
  students: WorkspaceStudent[];
};

const WorkspaceAccountContext = createContext<WorkspaceAccountContextValue>({
  currentStudentId: "",
  email: "",
  students: [],
});

type WorkspaceAccountProviderProps = WorkspaceAccountContextValue & {
  children: ReactNode;
};

export function WorkspaceAccountProvider({
  children,
  currentStudentId,
  email,
  students,
}: WorkspaceAccountProviderProps) {
  const currentStudent = students.find((student) => student.id === currentStudentId) ?? students[0];
  const themeColor = currentStudent?.themeColor ?? "#2f6f55";

  return (
    <WorkspaceAccountContext.Provider value={{ currentStudentId, email, students }}>
      <div className="student-theme-shell" style={{ "--student-color": themeColor } as CSSProperties}>
        {children}
      </div>
    </WorkspaceAccountContext.Provider>
  );
}

export function useWorkspaceAccount() {
  return useContext(WorkspaceAccountContext);
}
