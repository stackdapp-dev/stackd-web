/**
 * @vitest-environment jsdom
 */
/**
 * TDD Tests for DeveloperModeProvider
 *
 * This provider manages developer mode state with localStorage persistence.
 * Similar pattern to VisibilityProvider but for developer mode toggle.
 *
 * Requirements:
 * - localStorage key: "stackd:developerMode"
 * - Default value: false
 * - Export: { developerMode: boolean, setDeveloperMode: (v: boolean) => void, toggle: () => void }
 * - Hook: useDeveloperMode()
 * - Provider: DeveloperModeProvider
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";

// We'll import after writing the implementation
// import { DeveloperModeProvider, useDeveloperMode } from "@/providers/developerMode";

describe("DeveloperModeProvider", () => {
  // Mock localStorage
  let localStorageMock: Record<string, string | null>;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Reset module cache so each test gets a fresh import
    vi.resetModules();
    localStorageMock = {};

    // Save original localStorage
    originalLocalStorage = window.localStorage;

    // Create a mock localStorage object
    const mockStorage = {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
      key: (index: number) => Object.keys(localStorageMock)[index] ?? null,
      get length() {
        return Object.keys(localStorageMock).length;
      },
    };

    // Replace window.localStorage
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original localStorage
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe("Default State", () => {
    it("should default to false when localStorage is empty", async () => {
      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(false);
    });

    it("should read true from localStorage if set", async () => {
      localStorageMock["stackd:developerMode"] = "true";

      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(true);
    });

    it("should read false from localStorage if set to false", async () => {
      localStorageMock["stackd:developerMode"] = "false";

      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(false);
    });
  });

  describe("setDeveloperMode", () => {
    it("should update state when setDeveloperMode(true) is called", async () => {
      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(false);

      act(() => {
        result.current.setDeveloperMode(true);
      });

      expect(result.current.developerMode).toBe(true);
    });

    it("should persist to localStorage when setDeveloperMode is called", async () => {
      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      act(() => {
        result.current.setDeveloperMode(true);
      });

      expect(localStorageMock["stackd:developerMode"]).toBe("true");
    });

    it("should update state when setDeveloperMode(false) is called", async () => {
      localStorageMock["stackd:developerMode"] = "true";

      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(true);

      act(() => {
        result.current.setDeveloperMode(false);
      });

      expect(result.current.developerMode).toBe(false);
      expect(localStorageMock["stackd:developerMode"]).toBe("false");
    });
  });

  describe("toggle", () => {
    it("should flip state from false to true", async () => {
      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(false);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.developerMode).toBe(true);
    });

    it("should flip state from true to false", async () => {
      localStorageMock["stackd:developerMode"] = "true";

      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.developerMode).toBe(false);
    });

    it("should persist toggle result to localStorage", async () => {
      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      act(() => {
        result.current.toggle();
      });

      expect(localStorageMock["stackd:developerMode"]).toBe("true");

      act(() => {
        result.current.toggle();
      });

      expect(localStorageMock["stackd:developerMode"]).toBe("false");
    });
  });

  describe("Hook Error Handling", () => {
    it("should throw error when useDeveloperMode is used outside provider", async () => {
      const { useDeveloperMode } = await import("@/providers/developerMode");

      // renderHook without wrapper should cause the hook to throw
      expect(() => {
        renderHook(() => useDeveloperMode());
      }).toThrow("useDeveloperMode must be used within DeveloperModeProvider");
    });
  });

  describe("localStorage Error Handling", () => {
    it("should gracefully handle localStorage.getItem errors", async () => {
      // Override localStorage.getItem to throw
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: () => {
            throw new Error("localStorage access denied");
          },
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          key: () => null,
          length: 0,
        },
        writable: true,
        configurable: true,
      });

      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      // Should not throw, should default to false
      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      expect(result.current.developerMode).toBe(false);
    });

    it("should gracefully handle localStorage.setItem errors", async () => {
      // Override localStorage.setItem to throw
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: () => null,
          setItem: () => {
            throw new Error("localStorage is full");
          },
          removeItem: () => {},
          clear: () => {},
          key: () => null,
          length: 0,
        },
        writable: true,
        configurable: true,
      });

      const { DeveloperModeProvider, useDeveloperMode } = await import(
        "@/providers/developerMode"
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DeveloperModeProvider>{children}</DeveloperModeProvider>
      );

      const { result } = renderHook(() => useDeveloperMode(), { wrapper });

      // Should not throw, state should still update
      act(() => {
        result.current.setDeveloperMode(true);
      });

      expect(result.current.developerMode).toBe(true);
    });
  });
});
