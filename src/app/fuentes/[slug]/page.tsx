import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Fuente no disponible", robots: { index: false, follow: false } };

export default function SourceDetailPage() {
  notFound();
}
