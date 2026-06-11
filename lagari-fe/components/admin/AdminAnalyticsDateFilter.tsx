"use client";

import { useState } from "react";
import type { AnalyticsPreset, AnalyticsRangeParams } from "@/lib/api/admin";

const PRESETS: { id: AnalyticsPreset; label: string }[] = [
  { id: "this_week", label: "This week" },
  { id: "last_7_days", label: "Last 7 days" },
  { id: "this_month", label: "This month" },
  { id: "this_year", label: "This year" },
  { id: "last_30_days", label: "Last 30 days" },
];

type Props = {
  value: AnalyticsRangeParams;
  onChange: (range: AnalyticsRangeParams) => void;
  activeLabel?: string;
};

function isPresetRange(
  range: AnalyticsRangeParams,
): range is { preset: AnalyticsPreset } {
  return "preset" in range;
}

export function AdminAnalyticsDateFilter({ value, onChange, activeLabel }: Props) {
  const [customFrom, setCustomFrom] = useState(
    isPresetRange(value) ? "" : value.from,
  );
  const [customTo, setCustomTo] = useState(
    isPresetRange(value) ? "" : value.to,
  );
  const [showCustom, setShowCustom] = useState(!isPresetRange(value));

  function applyCustom() {
    if (!customFrom || !customTo) return;
    onChange({ from: customFrom, to: customTo });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const active = isPresetRange(value) && value.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setShowCustom(false);
                onChange({ preset: p.id });
              }}
              className={`admin-btn rounded-sm px-3 py-2 text-sm ${
                active && !showCustom
                  ? "admin-btn-primary"
                  : "admin-card border border-lagari-border"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowCustom((s) => !s)}
          className={`admin-btn rounded-sm px-3 py-2 text-sm ${
            showCustom || !isPresetRange(value)
              ? "admin-btn-primary"
              : "admin-card border border-lagari-border"
          }`}
        >
          Custom range
        </button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-lagari-muted">From (PKT)</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="admin-input px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-lagari-muted">To (PKT)</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="admin-input px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!customFrom || !customTo}
            className="admin-btn admin-btn-primary h-[42px] px-4 text-sm disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {activeLabel ? (
        <p className="text-xs text-lagari-muted">{activeLabel}</p>
      ) : null}
    </div>
  );
}
