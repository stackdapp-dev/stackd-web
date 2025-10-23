import Providers from "@/providers/providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stack'd",
  description: "Spend BTC Without Selling",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={
          `${inter.variable} antialiased ` +
          `w-full h-screen bg-black md:max-w-sm md:mx-auto`
        }
      >
        <div className="bg-[url('/bg.jpg')] bg-cover bg-bottom bg-no-repeat w-full h-full">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
