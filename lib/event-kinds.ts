export const EVENT_KINDS = ["weddings", "communions", "corporate", "family"] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

export const NON_WEDDING_EVENT_KINDS = EVENT_KINDS.filter(
  (eventKind): eventKind is Exclude<EventKind, "weddings"> => eventKind !== "weddings",
);
