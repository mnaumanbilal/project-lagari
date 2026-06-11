"use client";

import { useCallback, useMemo, useState } from "react";

export function useAdminRowSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const selectedCount = selectedIds.size;

  const selectionState = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        return { allSelected: false, someSelected: false };
      }
      let count = 0;
      for (const id of ids) {
        if (selectedIds.has(id)) count += 1;
      }
      return {
        allSelected: count === ids.length,
        someSelected: count > 0 && count < ids.length,
      };
    },
    [selectedIds],
  );

  const selectedArray = useMemo(() => [...selectedIds], [selectedIds]);

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    toggle,
    toggleAll,
    clear,
    isSelected,
    selectionState,
  };
}
