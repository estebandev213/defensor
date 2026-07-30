import type { Metadata } from "next";
import { ChatShell } from "@/components/chat-shell";

export const metadata: Metadata = {
  title: "Consulta laboral",
  description: "Espacio anónimo para preparar una consulta de orientación laboral.",
  alternates: { canonical: "/chat" },
  robots: { index: false, follow: false },
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : undefined;
  return <ChatShell initialQuery={initialQuery} />;
}
