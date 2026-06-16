import { WhatsAppIcon } from "@/app/assets/SvgIcons";
import { customerWhatsAppHref } from "@/lib/admin/customer-whatsapp";

type Props = {
  phone: string;
  /** `table` — phone + icon button on one row; `default` — phone + labeled button */
  variant?: "default" | "table";
};

const whatsappButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-sm border border-[#25D366]/35 bg-[#25D366]/10 text-[#25D366] transition-colors hover:bg-[#25D366]/20";

function WhatsAppButton({
  href,
  phone,
  iconOnly = false,
}: {
  href: string;
  phone: string;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${whatsappButtonClass} h-7 w-7`}
        aria-label={`WhatsApp ${phone}`}
        title={`WhatsApp ${phone}`}
      >
        <WhatsAppIcon size={14} />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${whatsappButtonClass} gap-1.5 px-2.5 py-1 text-xs font-medium`}
    >
      <WhatsAppIcon size={14} />
      WhatsApp
    </a>
  );
}

export function AdminCustomerPhoneLinks({
  phone,
  variant = "default",
}: Props) {
  const whatsappHref = customerWhatsAppHref(phone);

  if (!phone || phone === "—") {
    return <span className="text-lagari-muted">—</span>;
  }

  if (variant === "table") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`tel:${phone}`}
          className="text-sm tabular-nums text-lagari-brass hover:underline"
        >
          {phone}
        </a>
        {whatsappHref ? (
          <WhatsAppButton href={whatsappHref} phone={phone} iconOnly />
        ) : null}
      </div>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
      <a
        href={`tel:${phone}`}
        className="font-medium text-lagari-brass hover:underline"
      >
        {phone}
      </a>
      {whatsappHref ? (
        <WhatsAppButton href={whatsappHref} phone={phone} />
      ) : null}
    </span>
  );
}

/** Stacked name + contact links for order table cells. */
export function AdminOrderCustomerCell({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  return (
    <div className="flex min-w-[9.5rem] max-w-[13rem] flex-col py-0.5">
      <span className="font-medium leading-snug text-lagari-primary">
        {name || "—"}
      </span>
      <AdminCustomerPhoneLinks phone={phone} variant="table" />
    </div>
  );
}
