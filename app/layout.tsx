import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Socratic Mentor ✦ Socratic AI Tutor",
  description:
    "Socratic Mentor — an AI tutor that guides you to reason, not just gives answers.",
  openGraph: {
    title: "Socratic Mentor ✦ Socratic AI Tutor",
    description:
      "An AI tutor that guides you to reason — not just gives answers.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Socratic Mentor ✦ Socratic AI Tutor",
    description:
      "An AI tutor that guides you to reason — not just gives answers.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06040c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
