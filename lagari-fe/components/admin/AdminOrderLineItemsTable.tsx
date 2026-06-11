import type { AdminOrderItem } from "@/lib/api/admin";
import { formatPkr } from "@/lib/format";

type Props = {
  items: AdminOrderItem[];
  subtotalPkr: number;
  discountPkr?: number;
  totalPkr: number;
  compact?: boolean;
};

export function AdminOrderLineItemsTable({
  items,
  subtotalPkr,
  discountPkr = 0,
  totalPkr,
  compact = false,
}: Props) {
  const cellPad = compact ? "px-3 py-2" : "px-4 py-3";

  return (
    <>
      <ul className="space-y-2 lg:hidden">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-sm border border-lagari-border/80 bg-lagari-elevated/30 p-3 text-sm"
          >
            <p className="font-medium text-lagari-primary">
              {item.productTitleSnapshot}
            </p>
            <p className="mt-0.5 text-xs text-lagari-muted">
              {item.variantNameSnapshot}
            </p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-lagari-brass-dim">Qty</dt>
                <dd className="tabular-nums">{item.quantity}</dd>
              </div>
              <div>
                <dt className="text-lagari-brass-dim">Unit</dt>
                <dd className="tabular-nums">{formatPkr(item.unitPricePkr)}</dd>
              </div>
              <div>
                <dt className="text-lagari-brass-dim">Line</dt>
                <dd className="font-medium tabular-nums">
                  {formatPkr(item.lineTotalPkr)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
        <li className="rounded-sm border border-lagari-border/80 bg-lagari-elevated/20 p-3 text-sm">
          <div className="flex justify-between text-lagari-muted">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPkr(subtotalPkr)}</span>
          </div>
          {discountPkr > 0 ? (
            <div className="mt-1 flex justify-between text-lagari-danger">
              <span>Discount</span>
              <span className="tabular-nums">−{formatPkr(discountPkr)}</span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-lagari-border/60 pt-2 font-semibold text-lagari-brass">
            <span>Order total</span>
            <span className="tabular-nums">{formatPkr(totalPkr)}</span>
          </div>
        </li>
      </ul>

      <div className="hidden overflow-x-auto rounded-sm border border-lagari-border/80 lg:block">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-lagari-border bg-lagari-elevated/50 font-label text-xs uppercase tracking-wide text-lagari-brass-dim">
            <tr>
              <th className={`${cellPad} font-semibold`}>Product</th>
              <th className={`${cellPad} font-semibold`}>Variant</th>
              <th className={`${cellPad} text-right font-semibold`}>Qty</th>
              <th className={`${cellPad} text-right font-semibold`}>Unit price</th>
              <th className={`${cellPad} text-right font-semibold`}>Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lagari-border/50">
            {items.map((item) => (
              <tr key={item.id} className="text-lagari-primary">
                <td className={`${cellPad} font-medium`}>
                  {item.productTitleSnapshot}
                </td>
                <td className={`${cellPad} text-lagari-muted`}>
                  {item.variantNameSnapshot}
                </td>
                <td className={`${cellPad} text-right tabular-nums`}>
                  {item.quantity}
                </td>
                <td className={`${cellPad} text-right tabular-nums text-lagari-muted`}>
                  {formatPkr(item.unitPricePkr)}
                </td>
                <td className={`${cellPad} text-right font-medium tabular-nums`}>
                  {formatPkr(item.lineTotalPkr)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-lagari-border bg-lagari-elevated/30">
            <tr>
              <td colSpan={4} className={`${cellPad} text-right text-lagari-muted`}>
                Subtotal
              </td>
              <td className={`${cellPad} text-right tabular-nums text-lagari-primary`}>
                {formatPkr(subtotalPkr)}
              </td>
            </tr>
            {discountPkr > 0 ? (
              <tr>
                <td colSpan={4} className={`${cellPad} text-right text-lagari-muted`}>
                  Discount
                </td>
                <td className={`${cellPad} text-right tabular-nums text-lagari-danger`}>
                  −{formatPkr(discountPkr)}
                </td>
              </tr>
            ) : null}
            <tr className="border-t border-lagari-border/80">
              <td
                colSpan={4}
                className={`${cellPad} text-right font-semibold text-lagari-primary`}
              >
                Order total
              </td>
              <td
                className={`${cellPad} text-right font-semibold tabular-nums text-lagari-brass`}
              >
                {formatPkr(totalPkr)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
