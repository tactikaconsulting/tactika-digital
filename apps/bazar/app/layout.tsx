import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bazar",
  description: "Marketplace local multi-comercio de Tactika.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
