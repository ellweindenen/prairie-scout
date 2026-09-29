import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prairie Scout",
  description: "Find the right South Dakota hunt — and the lodge that fits it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-stone-200 bg-amber-800 text-amber-50">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              Prairie Scout
            </Link>
            <Link href="/" className="hover:underline">Lodges</Link>
            <Link href="/match" className="hover:underline">Type your hunt</Link>
            <Link href="/compare" className="hover:underline">Compare</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-stone-500">
          Hunting rules, seasons and dates: always check the official SD Game, Fish &amp; Parks
          handbook. Prairie Scout does not provide regulations.
        </footer>
      </body>
    </html>
  );
}
