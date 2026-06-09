import type { PolicyDocument } from "@/lib/policies/types";

export const EXCHANGE_POLICY: PolicyDocument = {
  title: "Return & Exchange Policy",
  eyebrow: "Refund policy",
  intro:
    "We want you to be confident in every LAGARI impression. If your purchase is not quite right, review the return and exchange guidelines below.",
  sections: [
    {
      id: "return-window",
      title: "10-day return policy",
      paragraphs: [
        "We offer a 10-day return window for customers who are not fully satisfied with their purchase.",
        "To be eligible for return:",
      ],
      bullets: [
        "The request must be made within 10 days of receiving the order.",
        "The perfume must have at least 47ml remaining in the bottle.",
        "The product must be in original packaging and in good condition.",
        "The bottle and box must not be severely damaged.",
        "Return is applicable only for genuine dissatisfaction with the fragrance.",
      ],
    },
    {
      id: "exchange",
      title: "Exchange policy",
      paragraphs: [
        "We also offer exchanges within 10 days under the following conditions:",
      ],
      bullets: [
        "Product must be unused or minimally used (minimum 49ml remaining rule applies).",
        "Must be in original packaging, sealed or near-new condition.",
        "Only one exchange per order is allowed.",
        "Exchange depends on stock availability.",
        "Price difference will be charged or adjusted where applicable.",
      ],
    },
    {
      id: "important-conditions",
      title: "Important conditions",
      bullets: [
        "An unboxing video is required for damaged, defective, or incorrect items.",
        "Return shipping cost will be borne by the customer unless the error is from our side.",
        "All returns are subject to inspection and approval by the LAGARI team.",
      ],
    },
    {
      id: "how-to-request",
      title: "How to request a return or exchange",
      paragraphs: [
        "Contact our customer support within 10 days with the following details. Our team will guide you through the process.",
      ],
      bullets: [
        "Order number",
        "Clear images or videos of the product",
        "Reason for return or exchange",
      ],
      links: [{ text: "Contact customer support", href: "/contact" }],
    },
  ],
};
