import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "BuddyScript",
  description: "Connect with friends and share your moments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CSS Files */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/common.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/responsive.css" />

        {/* 🔥 Dark mode script আগে run হবে */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var dark = localStorage.getItem('darkMode') === 'true';
                if (dark) {
                  document.documentElement.classList.add('_dark_wrapper');
                  document.body.classList.add('_dark_wrapper');
                }
              } catch (e) {}
            })();
          `}
        </Script>
      </head>

      <body
        suppressHydrationWarning
        className={`${poppins.variable} font-poppins`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}