import { AdminCustomerPhoneLinks } from "./AdminCustomerPhoneLinks";

type Props = {
  name: string;
  phone: string;
  email?: string | null;
  city: string;
  address: string;
  dense?: boolean;
};

export function AdminOrderCustomerSummary({
  name,
  phone,
  email,
  city,
  address,
  dense = false,
}: Props) {
  return (
    <div className={dense ? "space-y-2" : "space-y-3"}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-lagari-brass-dim">
        Customer &amp; delivery
      </h3>
      <dl className={`grid grid-cols-1 gap-x-6 gap-y-2 text-sm ${dense ? "min-[480px]:grid-cols-2" : "sm:grid-cols-[auto_1fr]"}`}>
        <div className={dense ? "" : "sm:contents"}>
          <dt className="text-lagari-muted">Name</dt>
          <dd className="font-medium text-lagari-primary">{name || "—"}</dd>
        </div>
        <div className={dense ? "" : "sm:contents"}>
          <dt className="text-lagari-muted">Phone</dt>
          <dd>
            <AdminCustomerPhoneLinks phone={phone} />
          </dd>
        </div>
        {email ? (
          <div className={dense ? "min-[480px]:col-span-2" : "sm:contents"}>
            <dt className="text-lagari-muted">Email</dt>
            <dd className="min-w-0 break-all">
              <a href={`mailto:${email}`} className="text-lagari-brass hover:underline">
                {email}
              </a>
            </dd>
          </div>
        ) : null}
        <div className={dense ? "min-[480px]:col-span-2" : "sm:col-span-2 sm:grid sm:grid-cols-[auto_1fr] sm:gap-x-6"}>
          <dt className="text-lagari-muted">Address</dt>
          <dd className="min-w-0 break-words text-lagari-primary">
            <span className="font-medium">{city}</span>
            <span className="mt-0.5 block whitespace-pre-wrap break-words text-lagari-muted">
              {address}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
