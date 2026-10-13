"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { createWorkspace, getWorkspaces } from "./api";
import type { Workspace } from "./types";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  switchWorkspace: (workspaceId: string) => void;
  createAndSelectWorkspace: (name: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
  updateCurrentWorkspaceName: (name: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
);

const LOCAL_STORAGE_KEY = "converso_current_workspace_id";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const list = await getWorkspaces(token);
      setWorkspaces(list);

      if (list.length > 0) {
        const savedId =
          typeof window !== "undefined"
            ? localStorage.getItem(LOCAL_STORAGE_KEY)
            : null;

        const matching = list.find((w) => w.id === savedId);
        const selected = matching || list[0]!;
        setCurrentWorkspace(selected);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, selected.id);
        }
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load workspaces",
      );
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const match = workspaces.find((w) => w.id === workspaceId);
      if (match) {
        setCurrentWorkspace(match);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, match.id);
        }
      }
    },
    [workspaces],
  );

  const createAndSelectWorkspace = useCallback(
    async (name: string): Promise<Workspace> => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const created = await createWorkspace(token, name);
      setWorkspaces((prev) => [created, ...prev]);
      setCurrentWorkspace(created);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, created.id);
      }
      return created;
    },
    [getToken],
  );

  const updateCurrentWorkspaceName = useCallback((name: string) => {
    setCurrentWorkspace((prev) => (prev ? { ...prev, name } : null));
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === currentWorkspace?.id ? { ...w, name } : w)),
    );
  }, [currentWorkspace?.id]);

  const needsOnboarding =
    isLoaded && isSignedIn && !loading && workspaces.length === 0;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        error,
        needsOnboarding,
        switchWorkspace,
        createAndSelectWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        updateCurrentWorkspaceName,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
