import { MessageCircle } from "lucide-react";

type WhatsAppButtonProps = {
  phone: string;
};

export function WhatsAppButton({ phone }: WhatsAppButtonProps) {
  if (!phone) return null;

  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="פתיחת שיחה ב-WhatsApp"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl"
    >
      <MessageCircle className="h-7 w-7" strokeWidth={1.5} />
    </a>
  );
}
