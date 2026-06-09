import type { PolicyDocument } from "@/lib/policies/types";

export const TERMS_OF_SERVICE: PolicyDocument = {
  title: "Terms of Service",
  eyebrow: "Legal",
  intro:
    "Welcome to LAGARI. By accessing or purchasing from our website, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before using our services.",
  sections: [
    {
      id: "general",
      title: "General",
      bullets: [
        "By placing an order on our website, you confirm that you are at least 18 years old or using the website under parental supervision.",
        "We reserve the right to update, modify, or change these Terms & Conditions at any time without prior notice.",
        "Continued use of our website constitutes acceptance of any changes.",
      ],
    },
    {
      id: "products",
      title: "Products & descriptions",
      bullets: [
        "Lagari specializes in high-end perfumes for men and women.",
        "We strive to ensure that all product descriptions, images, and details are accurate. However, slight variations in packaging or design may occur.",
        "Fragrance preferences are subjective; we are not responsible if a scent does not meet personal expectations.",
      ],
    },
    {
      id: "pricing",
      title: "Pricing & payments",
      bullets: [
        "All prices are listed in PKR (unless otherwise stated).",
        "We reserve the right to change prices at any time without prior notice.",
        "Orders will only be processed after full payment confirmation (for prepaid orders) or order confirmation (for Cash on Delivery, if applicable).",
      ],
    },
    {
      id: "orders",
      title: "Orders & cancellation",
      bullets: [
        "Lagari reserves the right to refuse or cancel any order due to stock unavailability, pricing errors, or suspected fraudulent activity.",
        "Once an order is confirmed and processed, it cannot be canceled.",
      ],
    },
    {
      id: "shipping",
      title: "Shipping & delivery",
      bullets: [
        "Delivery timelines are estimates and may vary due to location or unforeseen circumstances.",
        "Lagari is not responsible for delays caused by courier services.",
        "Customers must provide accurate shipping information. We are not liable for failed deliveries due to incorrect details.",
      ],
    },
    {
      id: "refunds",
      title: "No refund policy",
      bullets: [
        "All purchases made through Lagari are final.",
        "We do not offer refunds under any circumstances.",
        "Exchanges are handled strictly according to our Exchange Policy.",
      ],
    },
    {
      id: "exchange-reference",
      title: "Exchange policy reference",
      bullets: [
        "Exchanges are subject to stock availability.",
        "Products must remain unused, unsprayed, sealed, and in original packaging.",
        "An unboxing video is required for damaged or incorrect items.",
        "Sale items are not eligible for exchange unless defective.",
      ],
      links: [
        {
          text: "Read our full Exchange Policy",
          href: "/policies/exchange",
        },
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual property",
      paragraphs: [
        "All content on this website, including logos, images, product names, and text, is the property of Lagari and may not be copied, reproduced, or used without written permission.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      bullets: [
        "Lagari shall not be held liable for any allergic reactions or skin sensitivities caused by our products. Customers are advised to review ingredients and perform a patch test before use.",
        "We are not responsible for indirect, incidental, or consequential damages arising from the use of our products or website.",
      ],
    },
    {
      id: "contact",
      title: "Contact information",
      paragraphs: [
        "For any questions regarding these Terms & Conditions, please contact our customer support team through the contact details provided on our website.",
      ],
      links: [{ text: "Contact customer support", href: "/contact" }],
    },
  ],
};
