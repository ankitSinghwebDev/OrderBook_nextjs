import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "antd/dist/reset.css";
import Header from "@/components/Header";
import Providers from "@/store/Providers";
import Breadcrumbs from "@/components/Breadcrumbs";
import ErrorBoundary from "@/components/ErrorBoundary";
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
  title: "OrderBook - Purchase Order Management",
  description: "Professional Purchase Order Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden will-change-auto">
            <div
              className="absolute -left-24 top-10 h-72 w-72 rounded-full opacity-40 blur-3xl"
              style={{ backgroundColor: "var(--accent-soft)" }}
            />
            <div
              className="absolute right-[-6rem] top-40 h-80 w-80 rounded-full opacity-30 blur-3xl"
              style={{ backgroundColor: "var(--accent-softer)" }}
            />
          </div>
          <Providers>
            <Header />
            <main className="mx-auto max-w-6xl px-6 py-8">
              <Breadcrumbs />
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
