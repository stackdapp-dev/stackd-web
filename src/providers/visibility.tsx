"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface VisibilityContextValue {
  visible: boolean;
  setVisible: (v: boolean) => void;
  toggle: () => void;
}

const VisibilityContext = createContext<VisibilityContextValue | undefined>(undefined);

const STORAGE_KEY = "stackd:showAmounts";

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisibleState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw == null ? true : raw === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, visible ? "true" : "false");
    } catch {
      // ignore
    }
  }, [visible]);

  const setVisible = (v: boolean) => setVisibleState(v);
  const toggle = () => setVisibleState((s) => !s);

  return <VisibilityContext.Provider value={{ visible, setVisible, toggle }}>{children}</VisibilityContext.Provider>;
}

export function useVisibility() {
  const ctx = useContext(VisibilityContext);
  if (!ctx) throw new Error("useVisibility must be used within VisibilityProvider");
  return ctx;
}

export default VisibilityProvider;
