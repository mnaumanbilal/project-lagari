import { MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/site/contact";

type WhatsAppButtonProps = {
  className?: string;
  variant?: "footer" | "inline";
};

export function WhatsAppButton({
  className = "",
  variant = "footer",
}: WhatsAppButtonProps) {
  const base =
    variant === "footer"
      ? "inline-flex w-full items-center justify-center gap-2.5 rounded-sm border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-3 font-label text-sm text-[#25D366] transition-colors hover:border-[#25D366]/70 hover:bg-[#25D366]/20 sm:w-auto"
      : "inline-flex items-center gap-2 font-label text-sm text-[#25D366] transition-colors hover:underline";

  return (
    <a
      href={CONTACT.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with Lagari on WhatsApp at ${CONTACT.phone}`}
      className={`${base} ${className}`.trim()}
    >
      <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      Chat on WhatsApp
    </a>
  );
}
