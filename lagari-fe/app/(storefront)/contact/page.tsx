import type { Metadata } from "next";
import { ContactPageContent } from "@/components/storefront/ContactPageContent";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach LAGARI for product questions, orders, exchanges, and support. Phone, WhatsApp, and email.",
};

export default function ContactPage() {
  return <ContactPageContent />;
}
