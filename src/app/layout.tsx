import Providers from "@/providers/providers";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../../public/fonts/InterVariable.ttf",
  variable: "--font-inter",
  display: "swap",
});

const abcFavorit = localFont({
  src: "../../public/fonts/ABCFavorit-Medium.woff2",
  variable: "--font-abc-favorit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stack'd",
  description: "Spend BTC Without Selling",
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
          `${inter.variable} ${abcFavorit.variable} antialiased ` +
          `w-full h-screen bg-black md:max-w-sm md:mx-auto md:max-h-[90vh] md:mt-[5vh]`
        }
      >
        <div className="bg-[url('/bg.jpg')] bg-cover bg-bottom bg-no-repeat w-full h-full">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
