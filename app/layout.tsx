// app/layout.tsx (ROOT LAYOUT - MUST HAVE HTML/BODY)
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arid Assistant",
  description: "PMAS Arid Agriculture University Chat Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}