import Image from "next/image";
import Link from "next/link";
import logoSrc from "@/app/assets/images/lagari-white-no-bg.png";

type LagariLogoProps = {
  /**
   * White logo asset — use `onLight` on white/light backgrounds
   * so CSS invert renders it black and visible.
   */
  onLight?: boolean;
  /** Render as link to home */
  linked?: boolean;
  className?: string;
  priority?: boolean;
};

export function LagariLogo({
  onLight = false,
  linked = true,
  className = "",
  priority = false,
}: LagariLogoProps) {
  const img = (
    <Image
      src={logoSrc}
      alt="Lagari"
      width={160}
      height={72}
      priority={priority}
      className={`h-10 w-auto sm:h-12 ${onLight ? "invert" : ""} ${className}`}
    />
  );

  if (!linked) return img;

  return (
    <Link href="/" className="inline-block shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lagari-brass">
      {img}
    </Link>
  );
}
