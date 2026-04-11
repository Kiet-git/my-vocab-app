import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucid Polyglot",
  description: "Master Your Vocabulary Effortlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-background font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container antialiased">
        {children}
      </body>
    </html>
  );
}
