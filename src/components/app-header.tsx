'use client';

import {KrishiRakshakIcon} from './icons';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          <KrishiRakshakIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
            KrishiRakshak
          </h1>
        </div>
      </div>
    </header>
  );
}
