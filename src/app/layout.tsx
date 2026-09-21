import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { STORE_NAME } from "@/config/site";
import { getPublicSiteUrl } from "@/lib/env";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: {
    default: STORE_NAME,
    template: `%s | ${STORE_NAME}`,
  },
  description: `קטלוג האופניים והציוד של ${STORE_NAME}.`,
  applicationName: STORE_NAME,
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: STORE_NAME,
    title: STORE_NAME,
    description: `קטלוג האופניים והציוד של ${STORE_NAME}.`,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f4d3a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <a className="skip-link" href="#main-content">
          דלג לתוכן
        </a>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
