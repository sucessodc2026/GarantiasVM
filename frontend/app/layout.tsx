'use client';

import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <head>
        <meta name="description" content="Plataforma de Gestão de Garantias" />
        <title>Garantias VM</title>
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#2A3547',
                border: '1px solid #EAEFF4',
                borderRadius: '7px',
                fontSize: '14px',
                fontFamily: 'var(--font-plus-jakarta-sans), sans-serif',
                boxShadow: '0px 4px 18px rgba(47, 43, 61, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#23AF15',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
