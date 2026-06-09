/** Shared contact & social URLs for storefront pages */

export const CONTACT = {
  phone: "+92 321 0911174",
  phoneHref: "tel:+923210911174",
  whatsappHref: "https://wa.me/923210911174",
  email: "lagaristore@gmail.com",
  emailHref: "mailto:lagaristore@gmail.com",
  city: "Lahore, Pakistan",
  postalCode: "54000",
  responseTime: "24 to 48 working hours",
  tagline: "Crafted for Presence.",
} as const;

export const SOCIAL_LINKS = [
  {
    id: "instagram",
    href: "https://www.instagram.com/lagari.pk",
    label: "Lagari on Instagram (@lagari.pk)",
    handle: "@lagari.pk",
  },
  {
    id: "facebook",
    href: "https://www.facebook.com/profile.php?id=61572365760545",
    label: "Lagari on Facebook",
    handle: "Lagari",
  },
  {
    id: "tiktok",
    href: "https://www.tiktok.com/@lagari.pk",
    label: "Lagari on TikTok (@lagari.pk)",
    handle: "@lagari.pk",
  },
] as const;

export type SocialNetworkId = (typeof SOCIAL_LINKS)[number]["id"];
