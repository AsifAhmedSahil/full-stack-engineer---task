'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false}
      value={{
        light: 'light',
        dark: '_dark_wrapper'
      }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
