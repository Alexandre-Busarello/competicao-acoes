'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Atualizar favicon
    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    
    if (favicon) {
      favicon.href = newTheme === 'dark' ? '/favicon-escuro.svg' : '/favicon-claro.svg';
    }
    
    if (appleTouchIcon) {
      appleTouchIcon.href = newTheme === 'dark' ? '/favicon-escuro.svg' : '/favicon-claro.svg';
    }
    
    // Atualizar theme-color meta tag
    const themeColorMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (themeColorMeta) {
      themeColorMeta.content = newTheme === 'dark' ? '#252830' : '#ffffff';
    }
  }, []);

  useEffect(() => {
    // Verificar preferência salva ou preferência do sistema
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    
    // Verificar se a classe dark já está aplicada (pelo script inline)
    const hasDarkClass = document.documentElement.classList.contains('dark');
    
    let initialTheme: Theme;
    if (hasDarkClass) {
      // Se já tem a classe dark, usar dark
      initialTheme = 'dark';
    } else if (savedTheme) {
      // Se tem preferência salva, usar ela
      initialTheme = savedTheme;
    } else {
      // Caso contrário, verificar preferência do sistema
      initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    
    setThemeState(initialTheme);
    setMounted(true);
    // Garantir que o tema está aplicado (pode já estar pelo script inline)
    applyTheme(initialTheme);
  }, [applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Fornecer valores padrão mesmo quando não montado para evitar erros
  const contextValue = mounted 
    ? { theme, setTheme, toggleTheme }
    : { 
        theme: 'light' as Theme, 
        setTheme: () => {}, 
        toggleTheme: () => {} 
      };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Retornar valores padrão se não estiver dentro do provider
    // Isso evita erros durante SSR ou antes do provider montar
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

