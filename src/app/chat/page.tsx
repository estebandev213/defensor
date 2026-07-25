import type { Metadata } from "next";
import { ChatShell } from "@/components/chat-shell";

export const metadata: Metadata = {
  title: "Consulta laboral",
  description: "Espacio anónimo para preparar una consulta de orientación laboral.",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return <ChatShell />;
}
