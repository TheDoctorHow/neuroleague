import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroLeague",
  description: "Level up your skills. Beat your rivals. Become a Sage.",
  manifest: "/manifest.json",
  themeColor: "#9D6FFF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NeuroLeague",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}