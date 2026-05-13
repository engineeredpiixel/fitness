import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Fitness Trainer",
  description: "Personalized smart workout and diet plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
