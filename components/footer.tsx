"use client";

import { useEffect, useState } from "react";

export function Footer({ year }: { year: number }) {
  const [current, setCurrent] = useState(year);

  // The server renders the year it saw at build time. The first client render
  // uses that same prop so hydration matches, then this corrects it if the
  // build is old enough that the year has rolled over since.
  useEffect(() => {
    const now = new Date().getFullYear();
    if (now !== year) {
      setCurrent(now);
    }
  }, [year]);

  return (
    <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
      <p>&copy; {current} Veni. All rights reserved.</p>
    </footer>
  );
}
