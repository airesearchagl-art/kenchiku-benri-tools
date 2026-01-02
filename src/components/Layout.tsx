import Link from 'next/link';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center pl-6">
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" href="/">
              <span className="hidden font-bold sm:inline-block">建築便利ツール</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
               <Link href="/tools" className="transition-colors hover:text-foreground/80 text-foreground/60">Tools</Link>
               <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">About</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6 mx-auto">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built for Architects.
            </p>
        </div>
      </footer>
    </div>
  );
}
