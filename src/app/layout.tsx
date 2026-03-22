import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SOlicita - Gestão de Licitações",
  description: "Sistema de gestão de licitações empresariais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-bs-theme="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
