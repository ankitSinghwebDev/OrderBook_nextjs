import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "antd/dist/reset.css";
import Header from "@/components/Header";
import Providers from "@/store/Providers";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ThemeProvider } from "@/context/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Purchase Order",
  description: "Purchase Order Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div
              className="absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl animate-orb"
              style={{ backgroundColor: "var(--accent-soft)" }}
            />
            <div
              className="absolute right-[-6rem] top-40 h-80 w-80 rounded-full blur-3xl animate-orb-slow"
              style={{ backgroundColor: "var(--accent-softer)" }}
            />
            <div
              className="absolute left-1/2 bottom-0 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl animate-spin-slow"
              style={{ backgroundColor: "var(--accent-soft)" }}
            />
          </div>
          <Providers>
            <Header />
            <main className="mx-auto max-w-6xl px-6 py-8">
              <Breadcrumbs />
              {children}
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
