"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Environment, EnvironmentId, SeasonalSkinId, Theme } from "./types";
import { candyEnvironment } from "./candy";
import { kawaiiEnvironment } from "./kawaii";

/**
 * Central registry of environments. Add new ones here.
 */
const ENVIRONMENTS: Record<EnvironmentId, Environment> = {
  candy: candyEnvironment,
  kawaii: kawaiiEnvironment,
};

export const AVAILABLE_ENVIRONMENTS = Object.values(ENVIRONMENTS);

interface ThemeContextValue {
  theme: Theme;
  setEnvironment: (id: EnvironmentId) => void;
  setSeasonalSkin: (id: SeasonalSkinId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ExperienceThemeProviderProps {
  children: ReactNode;
  initialEnvironment?: EnvironmentId;
  initialSkin?: SeasonalSkinId;
}

export function ExperienceThemeProvider({
  children,
  initialEnvironment = "candy",
  initialSkin = "none",
}: ExperienceThemeProviderProps) {
  const [environmentId, setEnvironmentId] = useState<EnvironmentId>(initialEnvironment);
  const [seasonalSkin, setSeasonalSkin] = useState<SeasonalSkinId>(initialSkin);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: {
      environment: ENVIRONMENTS[environmentId],
      seasonalSkin,
    },
    setEnvironment: setEnvironmentId,
    setSeasonalSkin,
  }), [environmentId, seasonalSkin]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useExperienceTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      "useExperienceTheme must be used within ExperienceThemeProvider"
    );
  }
  return ctx;
}
