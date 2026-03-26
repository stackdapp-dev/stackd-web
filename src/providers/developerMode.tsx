"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface DeveloperModeContextValue {
  developerMode: boolean;
  setDeveloperMode: (v: boolean) => void;
  toggle: () => void;
}

const DeveloperModeContext = createContext<DeveloperModeContextValue | undefined>(undefined);

const STORAGE_KEY = "stackd:developerMode";

export function DeveloperModeProvider({ children }: { children: React.ReactNode }) {
  const [developerMode, setDeveloperModeState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw == null ? false : raw === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, developerMode ? "true" : "false");
    } catch {
      // ignore
    }
  }, [developerMode]);

  const setDeveloperMode = (v: boolean) => setDeveloperModeState(v);
  const toggle = () => setDeveloperModeState((s) => !s);

  return (
    <DeveloperModeContext.Provider value={{ developerMode, setDeveloperMode, toggle }}>
      {children}
    </DeveloperModeContext.Provider>
  );
}

export function useDeveloperMode() {
  const ctx = useContext(DeveloperModeContext);
  if (!ctx) throw new Error("useDeveloperMode must be used within DeveloperModeProvider");
  return ctx;
}

export default DeveloperModeProvider;
