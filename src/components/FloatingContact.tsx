import { MessageCircle, Phone } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { waLinkFrom } from "@/lib/whatsapp";

export function FloatingContact() {
  const { settings } = useSettings();
  const waLink = settings.whatsapp_number
    ? waLinkFrom(settings.whatsapp_number, "Hello! I have a question about your store.")
    : null;
  const tel = settings.contact_phone.replace(/[^0-9+]/g, "");
  if (!waLink && !tel) return null;
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
      {tel && (
        <a
          href={`tel:${tel}`}
          aria-label="Call the store"
          className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-lg shadow-accent/30 transition-transform hover:scale-105"
        >
          <Phone className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}
