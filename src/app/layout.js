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
          <Providers>
            <Header />
            <main className="mx-auto max-w-[1440px] px-6 pt-20 pb-6 lg:px-10">
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
