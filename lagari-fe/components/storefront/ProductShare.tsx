"use client";

import { useCallback, useState } from "react";
import {
  BlueskySocialIcon,
  FacebookIcon,
  LinkedinIcon,
  MetaThreadsIcon,
  ShareIcon,
  TwitterXIcon,
  WhatsAppIcon,
} from "@/app/assets/SvgIcons";
import { resolveClientProductUrl } from "@/lib/site/url";
import { useStorefrontToast } from "@/lib/storefront/toast-context";

type SharePlatform =
  | "linkedin"
  | "twitter"
  | "facebook"
  | "bluesky"
  | "threads"
  | "whatsapp"
  | "instagram"
  | "tiktok"
  | "copy";

type ProductShareProps = {
  slug: string;
  shareText: string;
};

function openCenteredPopup(platform: string): Window | null {
  const width = 600;
  const height = 600;
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;
  const widthScroll = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width;
  const heightScroll = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height;
  const left = widthScroll / 2 - width / 2 + dualScreenLeft;
  const top = heightScroll / 2 - height / 2 + dualScreenTop;
  const windowName = `${platform}-share-${Date.now()}`;
  const popup = window.open(
    "about:blank",
    windowName,
    `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=yes`,
  );
  if (popup) {
    try {
      popup.opener = null;
    } catch {
      /* ignore */
    }
    popup.document.write(`
      <html><head><title>Preparing share…</title></head>
      <body style="background:#0a0908;color:#f5f0e8;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;margin:0;">
        Preparing share…
      </body></html>`);
    popup.document.close();
  }
  return popup;
}

function ShareButton({
  title,
  onClick,
  disabled,
  busy,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled || busy}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-sm border border-lagari-border bg-lagari-surface text-lagari-muted transition-colors hover:border-lagari-brass/50 hover:bg-lagari-brass/10 hover:text-lagari-brass disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-lagari-muted border-t-transparent" />
      ) : (
        children
      )}
    </button>
  );
}

export function ProductShare({ slug, shareText }: ProductShareProps) {
  const toast = useStorefrontToast();
  const [sharingPlatform, setSharingPlatform] = useState<SharePlatform | null>(
    null,
  );

  const shareUrl = resolveClientProductUrl(slug);

  const copyLink = useCallback(async () => {
    setSharingPlatform("copy");
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    } finally {
      setSharingPlatform(null);
    }
  }, [shareUrl, toast]);

  const handleSocialShare = useCallback(
    async (platform: Exclude<SharePlatform, "copy" | "instagram" | "tiktok">) => {
      setSharingPlatform(platform);
      const popup = openCenteredPopup(platform);
      try {
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedText = encodeURIComponent(shareText);
        let finalUrl = "";
        if (platform === "linkedin") {
          finalUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        } else if (platform === "twitter") {
          finalUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        } else if (platform === "facebook") {
          finalUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        } else if (platform === "bluesky") {
          finalUrl = `https://bsky.app/intent/compose?text=${encodedText}%20${encodedUrl}`;
        } else if (platform === "threads") {
          finalUrl = `https://www.threads.net/intent/post?url=${encodedUrl}&text=${encodedText}`;
        } else if (platform === "whatsapp") {
          finalUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        }
        if (popup) popup.location.href = finalUrl;
        else window.open(finalUrl, "_blank", "noopener,noreferrer");
      } catch {
        toast.error("Could not open share window");
        popup?.close();
      } finally {
        setSharingPlatform(null);
      }
    },
    [shareText, shareUrl, toast],
  );

  const copyForPaste = useCallback(
    async (platform: "instagram" | "tiktok") => {
      setSharingPlatform(platform);
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(
          platform === "instagram"
            ? "Link copied — paste in Instagram"
            : "Link copied — paste in TikTok",
        );
      } catch {
        toast.error("Could not copy link");
      } finally {
        setSharingPlatform(null);
      }
    },
    [shareUrl, toast],
  );

  const busy = sharingPlatform !== null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Share product">
      <span className="font-label mr-1 text-xs text-lagari-brass-dim">Share</span>
      <ShareButton
        title="Share on LinkedIn"
        busy={sharingPlatform === "linkedin"}
        disabled={busy}
        onClick={() => void handleSocialShare("linkedin")}
      >
        <LinkedinIcon />
      </ShareButton>
      <ShareButton
        title="Share on X"
        busy={sharingPlatform === "twitter"}
        disabled={busy}
        onClick={() => void handleSocialShare("twitter")}
      >
        <TwitterXIcon />
      </ShareButton>
      <ShareButton
        title="Share on Facebook"
        busy={sharingPlatform === "facebook"}
        disabled={busy}
        onClick={() => void handleSocialShare("facebook")}
      >
        <FacebookIcon />
      </ShareButton>
      <ShareButton
        title="Share on Bluesky"
        busy={sharingPlatform === "bluesky"}
        disabled={busy}
        onClick={() => void handleSocialShare("bluesky")}
      >
        <BlueskySocialIcon />
      </ShareButton>
      <ShareButton
        title="Share on Threads"
        busy={sharingPlatform === "threads"}
        disabled={busy}
        onClick={() => void handleSocialShare("threads")}
      >
        <MetaThreadsIcon />
      </ShareButton>
      <ShareButton
        title="Share on WhatsApp"
        busy={sharingPlatform === "whatsapp"}
        disabled={busy}
        onClick={() => void handleSocialShare("whatsapp")}
      >
        <WhatsAppIcon size={16} />
      </ShareButton>
      <ShareButton
        title="Copy link for Instagram"
        busy={sharingPlatform === "instagram"}
        disabled={busy}
        onClick={() => void copyForPaste("instagram")}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide">IG</span>
      </ShareButton>
      <ShareButton
        title="Copy link for TikTok"
        busy={sharingPlatform === "tiktok"}
        disabled={busy}
        onClick={() => void copyForPaste("tiktok")}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide">TT</span>
      </ShareButton>
      <ShareButton
        title="Copy product link"
        busy={sharingPlatform === "copy"}
        disabled={busy}
        onClick={() => void copyLink()}
      >
        <ShareIcon />
      </ShareButton>
    </div>
  );
}
