import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      {children}
      <Footer year={new Date().getFullYear()} />
    </div>
  );
}
