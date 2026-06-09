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
      <dl className={`grid gap-x-6 gap-y-2 text-sm ${dense ? "sm:grid-cols-2" : "sm:grid-cols-[auto_1fr]"}`}>
        <div className={dense ? "" : "sm:contents"}>
          <dt className="text-lagari-muted">Name</dt>
          <dd className="font-medium text-lagari-primary">{name || "—"}</dd>
        </div>
        <div className={dense ? "" : "sm:contents"}>
          <dt className="text-lagari-muted">Phone</dt>
          <dd>
            <a href={`tel:${phone}`} className="font-medium text-lagari-brass hover:underline">
              {phone}
            </a>
          </dd>
        </div>
        {email ? (
          <div className={dense ? "sm:col-span-2" : "sm:contents"}>
            <dt className="text-lagari-muted">Email</dt>
            <dd>
              <a href={`mailto:${email}`} className="text-lagari-brass hover:underline">
                {email}
              </a>
            </dd>
          </div>
        ) : null}
        <div className={dense ? "sm:col-span-2" : "sm:col-span-2 sm:grid sm:grid-cols-[auto_1fr] sm:gap-x-6"}>
          <dt className="text-lagari-muted">Address</dt>
          <dd className="text-lagari-primary">
            <span className="font-medium">{city}</span>
            <span className="mt-0.5 block whitespace-pre-wrap text-lagari-muted">
              {address}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
