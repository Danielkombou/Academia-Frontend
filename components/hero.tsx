import { Zap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="flex flex-col items-center px-4 py-20 text-center">
      <Badge className="mb-6 border border-primary/30 bg-primary/10 px-3.5 py-1.5 font-mono text-primary">
        <Zap aria-hidden="true" />
        Instant Bulk Certificate Generation &amp; PDF Export
      </Badge>

      <h1 className="mb-6 max-w-3xl font-serif text-4xl font-medium tracking-tight lg:text-6xl">
        Generate Certificates in Seconds
      </h1>

      <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
        Upload a template, upload your names file,
        <br />
        and download hundreds of certificates instantly.
      </p>

      <Button size="lg" nativeButton={false} render={<Link href="/generate" />}>
        Start Generating
      </Button>
    </section>
  );
}
