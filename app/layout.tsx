import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socratic Mentor",
  description:
    "An AI tutor that guides you to reason — not just gives answers.",
  openGraph: {
    title: "Socratic Mentor",
    description:
      "An AI tutor that guides you to reason — not just gives answers.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Socratic Mentor",
    description:
      "An AI tutor that guides you to reason — not just gives answers.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0614",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
