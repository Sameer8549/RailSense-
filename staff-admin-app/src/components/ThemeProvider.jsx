import { useEffect } from "react";
import { useStaffStore } from "@/store/staffStore.js";

export function ThemeProvider({ children }) {
  const theme = useStaffStore((s) => s.theme);
  const setTheme = useStaffStore((s) => s.setTheme);

  useEffect(() => {
    // Apply theme on mount
    setTheme(theme);

    // Listen for system preference changes when in "system" mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") setTheme("system"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, setTheme]);

  return children;
}
