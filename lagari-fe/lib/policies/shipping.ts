import type { PolicyDocument } from "@/lib/policies/types";

export const SHIPPING_POLICY: PolicyDocument = {
  title: "Shipping Policy",
  eyebrow: "Delivery",
  intro:
    "At Lagari, we are committed to delivering your fragrances safely, quickly, and reliably across Pakistan. Please review our shipping policy below for complete details.",
  sections: [
    {
      id: "processing",
      title: "Order processing time",
      bullets: [
        "All orders are processed within 1–2 working days after payment confirmation.",
        "During sales, promotions, or peak seasons, processing time may extend slightly.",
        "Every order goes through a quality check before dispatch to ensure you receive your fragrance in perfect condition.",
        "Once dispatched, your order is handed over to our trusted courier partners.",
        "You will receive a tracking link via SMS or email once your parcel is shipped.",
      ],
    },
    {
      id: "locations",
      title: "Shipping locations",
      bullets: [
        "We currently deliver nationwide across Pakistan.",
        "Delivery is subject to service availability by our courier partners.",
        "If your area is not serviceable, you will be informed during checkout or contacted by our support team.",
        "Delivery charges may vary depending on your city or region.",
      ],
    },
    {
      id: "delivery-time",
      title: "Estimated delivery time",
      bullets: [
        "Delivery typically takes 4–5 business days after dispatch.",
        "Remote areas may require additional time.",
        "Delays due to weather conditions, public holidays, or unforeseen circumstances may occur.",
        "In case of unexpected delays, our team will keep you informed.",
        "Our goal is always timely and reliable delivery.",
      ],
    },
    {
      id: "charges",
      title: "Shipping charges",
      bullets: [
        "A flat shipping fee of PKR 250 applies to all orders.",
        "Orders above PKR 4000 qualify for free shipping.",
        "All shipping charges are clearly displayed at checkout before payment.",
        "We maintain complete transparency — no hidden costs.",
      ],
    },
    {
      id: "tracking",
      title: "Order tracking & updates",
      bullets: [
        "Once your order is shipped, tracking details will be shared via email or SMS.",
        "You can monitor your parcel status in real time through the provided tracking link.",
        "If you experience any delivery issues, our support team is ready to assist you.",
        "Please ensure your contact details are accurate to receive timely updates.",
      ],
      links: [{ text: "Contact customer support", href: "/contact" }],
    },
  ],
  closingNote:
    "Thank you for choosing Lagari. We appreciate your trust and are committed to delivering premium fragrances with premium service.",
};
