import "./globals.css";
export const metadata = {
  title: "FINN — Signal over noise",
  description: "Your portfolio, distilled.",
  manifest: "/manifest.webmanifest",
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101715",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
