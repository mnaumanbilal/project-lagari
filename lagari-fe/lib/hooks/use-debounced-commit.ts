import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

/**
 * Local draft input that commits to a parent (usually URL) after debounce.
 * Uses refs for the commit callback so parent re-renders cannot retrigger commits.
 */
export function useDebouncedCommit(
  committed: string,
  onCommit: (value: string) => void,
  delayMs: number,
) {
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const syncedRef = useRef(committed.trim());
  const [draft, setDraft] = useState(committed);
  const debounced = useDebouncedValue(draft.trim(), delayMs);

  useEffect(() => {
    const external = committed.trim();
    if (external !== syncedRef.current) {
      syncedRef.current = external;
      setDraft(committed);
    }
  }, [committed]);

  useEffect(() => {
    if (debounced === syncedRef.current) return;
    syncedRef.current = debounced;
    onCommitRef.current(debounced);
  }, [debounced]);

  return {
    draft,
    setDraft,
    isDebouncing: draft.trim() !== debounced,
  };
}
