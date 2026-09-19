import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaraQueue — Your songs. Your queue. Your stage.",
  description: "Your songs. Your queue. Your stage."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
