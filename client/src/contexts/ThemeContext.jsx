import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

import { Monitor, Disc, Sparkles, Gamepad2, Sprout } from "lucide-react";

export const THEMES = [
  { id: "coder", name: "Coder", icon: <Monitor size={18} /> },
  { id: "vintage", name: "Vintage", icon: <Disc size={18} /> },
  { id: "soft-girl", name: "Soft Girl", icon: <Sparkles size={18} /> },
  { id: "retro-80s", name: "Retro 80s", icon: <Gamepad2 size={18} /> },
  { id: "earthy", name: "Earthy", icon: <Sprout size={18} /> }
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("smoother-theme") || "coder";
  });

  useEffect(() => {
    localStorage.setItem("smoother-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};
