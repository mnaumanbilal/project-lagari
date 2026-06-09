"use client";

import { useEffect, useState } from "react";

/** True after client mount — use to start entrance animations without waiting for scroll. */
export function useClientReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
}
