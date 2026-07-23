'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="description" content="Plataforma de Gestão de Garantias" />
        <title>GarantiaHub</title>
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1D26',
                color: '#F1F5F9',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#1A1D26',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#1A1D26',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
