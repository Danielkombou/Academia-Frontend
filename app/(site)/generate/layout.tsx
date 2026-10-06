import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate certificates, Veni",
  robots: { index: false },
};

export default function GenerateLayout({ children }: LayoutProps<"/generate">) {
  return children;
}
