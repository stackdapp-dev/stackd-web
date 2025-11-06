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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__ow = window.__ow || {};
              window.__ow.organizationId = "${process.env.NEXT_PUBLIC_OPENWIDGET_ORG_ID}";
              window.__ow.integration_name = "manual_settings";
              window.__ow.product_name = "openwidget";
              ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[OpenWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.openwidget.com/openwidget.js",t.head.appendChild(n)}};!n.__ow.asyncInit&&e.init(),n.OpenWidget=n.OpenWidget||e}(window,document,[].slice))
            `,
          }}
        />
      </head>
      <body
        className={
          `${inter.variable} antialiased ` +
          `w-full h-[100dvh] bg-black md:max-w-sm md:mx-auto overflow-hidden`
        }
      >
        <div className="bg-[url('/bg.jpg')] bg-cover bg-bottom bg-no-repeat w-full h-full overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))]">
          <Providers>{children}</Providers>
        </div>
        <noscript>
          You need to{" "}
          <a href="https://www.openwidget.com/enable-javascript" rel="noopener nofollow">
            enable JavaScript
          </a>{" "}
          to use the communication tool powered by{" "}
          <a href="https://www.openwidget.com/" rel="noopener nofollow" target="_blank">
            OpenWidget
          </a>
        </noscript>
      </body>
    </html>
  );
}
