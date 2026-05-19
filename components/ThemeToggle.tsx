"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("tripsplits-theme", next);
  }

  return (
    <button className="themeToggle" onClick={toggle} aria-label="Toggle theme" type="button">
      {theme === "dark" ? (
        <Sun size={16} strokeWidth={1.6} />
      ) : (
        <Moon size={16} strokeWidth={1.6} />
      )}
    </button>
  );
}
