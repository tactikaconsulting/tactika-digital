import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tactika Consulting",
  description: "Consultoria comercial, automatizacion y crecimiento digital.",
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
