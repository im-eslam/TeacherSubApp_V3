import { useMemo } from "react";
import { useEventKeys } from "../events/hooks";
import type { SelectorOption } from "./hooks";

export function useEventSelectorOptions(): {
  options: SelectorOption[];
  isLoading: boolean;
} {
  const { data: eventKeys = [], isLoading } = useEventKeys();

  const options = useMemo(
    () =>
      eventKeys.map((eventKey) => ({
        value: String(eventKey.id),
        label: eventKey.eventName,
      })),
    [eventKeys],
  );

  return { options, isLoading };
}
