import Link from "next/link";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="mb-4 font-mono text-xs text-primary">404</p>
        <h1 className="mb-3 font-serif text-4xl font-medium tracking-tight lg:text-5xl">
          That page does not exist
        </h1>
        <p className="mb-10 max-w-xl text-lg text-muted-foreground">
          The link may be mistyped, or the page may have moved. Start again from
          the beginning.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Back to the start
        </Link>
      </main>

      <Footer year={new Date().getFullYear()} />
    </div>
  );
}
