const CONSENT_COOKIE =
  "wellyura_cookie_consent_v2";

export type MetaConversionEvent =
  | "Lead"
  | "CompleteRegistration";

function hasMetaConsent() {
  if (
    typeof document === "undefined"
  ) {
    return false;
  }

  return document.cookie
    .split("; ")
    .some(
      (cookie) =>
        cookie ===
        `${CONSENT_COOKIE}=accepted`,
    );
}

function createEventId(
  eventName: MetaConversionEvent,
) {
  const prefix =
    eventName === "Lead"
      ? "lead"
      : "registration";

  return [
    prefix,
    Date.now(),
    crypto.randomUUID(),
  ].join("_");
}

export function trackMetaConversion(
  eventName: MetaConversionEvent,
) {
  if (
    typeof window === "undefined" ||
    !hasMetaConsent()
  ) {
    return;
  }

  const eventId =
    createEventId(eventName);

  const metaWindow =
    window as typeof window & {
      fbq?: (
        ...args: unknown[]
      ) => void;
    };

  if (metaWindow.fbq) {
    metaWindow.fbq(
      "track",
      eventName,
      {},
      {
        eventID: eventId,
      },
    );
  }

  void fetch(
    "/api/meta/events",
    {
      method: "POST",

      credentials:
        "same-origin",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl:
          window.location.href,
      }),

      keepalive: true,
    },
  ).catch(() => {
    // Conversion should not interrupt
    // the user's successful action.
  });
}