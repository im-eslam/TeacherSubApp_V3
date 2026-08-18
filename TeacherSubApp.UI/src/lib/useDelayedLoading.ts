import { useState, useEffect } from "react";

export function useDelayedLoading(isLoading: boolean, delayMs = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      timeout = setTimeout(() => setShowLoading(true), delayMs);
    } else {
      timeout = setTimeout(() => setShowLoading(false), 0);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isLoading, delayMs]);

  return showLoading;
}
