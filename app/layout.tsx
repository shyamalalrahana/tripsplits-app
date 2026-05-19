import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--poppins",
});

export const metadata: Metadata = {
  title: "TripSplits",
  description: "Split trip expenses, invite friends, and settle with UPI QR payments.",
  applicationName: "TripSplits",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "TripSplits" },
  icons: { icon: "/app-icon.svg", apple: "/app-icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B1020",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("tripsplits-theme")||"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${poppins.className} tripsplit-canvas`}>{children}</body>
    </html>
  );
}
