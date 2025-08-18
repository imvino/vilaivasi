import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Brand Matcher - VilaIvasi",
  description: "Brand matching and normalization system for e-commerce platforms",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="font-semibold text-lg">VilaIvasi</div>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <a href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</a>
                </li>
                <li>
                  <a href="/brand-matcher" className="hover:text-blue-600 dark:hover:text-blue-400">Brand Matcher</a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
