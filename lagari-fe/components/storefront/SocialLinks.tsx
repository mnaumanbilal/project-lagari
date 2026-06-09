import type { LucideProps } from "lucide-react";
import { SOCIAL_LINKS, type SocialNetworkId } from "@/lib/site/contact";

function BrandIcon({
  children,
  className,
  ...props
}: LucideProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function InstagramIcon(props: LucideProps) {
  return (
    <BrandIcon {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </BrandIcon>
  );
}

function FacebookIcon(props: LucideProps) {
  return (
    <BrandIcon {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </BrandIcon>
  );
}

function TikTokIcon(props: LucideProps) {
  return (
    <BrandIcon {...props}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </BrandIcon>
  );
}

const ICONS: Record<
  SocialNetworkId,
  React.ComponentType<LucideProps>
> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
};

type Props = {
  size?: "sm" | "md";
  className?: string;
};

export function SocialLinks({ size = "md", className = "" }: Props) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <ul className={`flex flex-wrap gap-3 ${className}`}>
      {SOCIAL_LINKS.map((link) => {
        const Icon = ICONS[link.id];
        return (
          <li key={link.id}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.handle}
              aria-label={link.label}
              className={`${btnClass} flex items-center justify-center rounded-sm border border-lagari-border bg-lagari-surface text-lagari-muted transition-colors duration-[var(--lagari-duration-fast)] hover:border-lagari-brass/50 hover:bg-lagari-brass/10 hover:text-lagari-brass`}
            >
              <Icon className={iconClass} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
