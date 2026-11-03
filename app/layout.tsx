import localFont from "next/font/local";
const newsreader = localFont({
  src: "./fonts/newsreader.woff2",
  variable: "--font-editorial",
  display: "swap",
});
const grotesk = localFont({
  src: "./fonts/intertight.woff2",
  variable: "--font-ui",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/jetbrainsmono.woff2",
  variable: "--font-numbers",
  display: "swap",
});
import "./globals.css";
export const metadata = {
  title: "FINN — Signal over noise",
  description: "Your portfolio, distilled.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101715",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${grotesk.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
