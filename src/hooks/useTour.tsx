import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether the first-run onboarding tour is currently open. The admin and admin
 * login read this to bypass the license gate while the tour plays as a guided
 * preview; the gate applies again once the tour closes.
 */
const TourContext = createContext<{ tourActive: boolean }>({ tourActive: false });

export function TourProvider({
  tourActive,
  children,
}: {
  tourActive: boolean;
  children: ReactNode;
}) {
  return <TourContext.Provider value={{ tourActive }}>{children}</TourContext.Provider>;
}

export function useTour() {
  return useContext(TourContext);
}
