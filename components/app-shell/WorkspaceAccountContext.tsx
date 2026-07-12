"use client";

import { createContext, type ReactNode, useContext } from "react";

export type WorkspaceStudent = {
  id: string;
  displayName: string;
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
  return (
    <WorkspaceAccountContext.Provider value={{ currentStudentId, email, students }}>
      {children}
    </WorkspaceAccountContext.Provider>
  );
}

export function useWorkspaceAccount() {
  return useContext(WorkspaceAccountContext);
}
