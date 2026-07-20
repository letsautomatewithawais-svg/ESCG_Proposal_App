import type { Metadata } from "next";
import { Caveat, Fraunces, IBM_Plex_Mono, Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const interBody = Inter({
  variable: "--font-inter-body",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["500"],
  subsets: ["latin"],
});

// Restrained brand-green identity's display face — distinctive geometric
// warmth instead of default Inter, which (per design research) reads as
// "unmodified default" rather than a considered choice. 700 gives headings a
// confident weight jump over 600, instead of relying on size alone.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  weight: ["600", "700"],
  subsets: ["latin"],
});

// Signature flourish on the proposal document's letter page only (the
// founder's "T Papa" signoff) — not used anywhere else in the app.
const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ESCG Proposal App",
  description: "Proposal generation tool for Eastern Suburbs Cleaning Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} ${interBody.variable} ${ibmPlexMono.variable} ${plusJakartaSans.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
