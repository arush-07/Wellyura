"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

const COOKIE_NAME =
  "wellyura_cookie_consent_v2";

type ConsentChoice =
  "accepted" |
  "rejected" |
  null;

type MetaFbq = ((
  ...args: unknown[]
) => void) & {
  callMethod?: (
    ...args: unknown[]
  ) => void;

  queue: unknown[][];

  loaded: boolean;

  version: string;

  push: (
    ...args: unknown[]
  ) => void;
};

declare global {
  interface Window {
    fbq?: MetaFbq;
    _fbq?: MetaFbq;
  }
}

function getCookieConsent():
  ConsentChoice {
  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  const consentCookie =
    document.cookie
      .split("; ")
      .find((cookie) =>
        cookie.startsWith(
          `${COOKIE_NAME}=`,
        ),
      );

  if (!consentCookie) {
    return null;
  }

  const value =
    consentCookie
      .split("=")[1];

  if (
    value === "accepted" ||
    value === "rejected"
  ) {
    return value;
  }

  return null;
}

function initialiseMetaPixel(
  pixelId: string,
) {
  if (window.fbq) {
    return window.fbq;
  }

  const fbq = function (
    ...args: unknown[]
  ) {
    if (fbq.callMethod) {
      fbq.callMethod(
        ...args,
      );

      return;
    }

    fbq.queue.push(args);
  } as MetaFbq;

  fbq.queue = [];

  fbq.loaded = true;

  fbq.version = "2.0";

  fbq.push = fbq;

  window.fbq = fbq;

  window._fbq = fbq;

  if (
    !document.getElementById(
      "meta-pixel-script",
    )
  ) {
    const script =
      document.createElement(
        "script",
      );

    script.id =
      "meta-pixel-script";

    script.async = true;

    script.src =
      "https://connect.facebook.net/en_US/fbevents.js";

    document.head.appendChild(
      script,
    );
  }

  fbq(
    "init",
    pixelId,
  );

  return fbq;
}

function createEventId() {
  return [
    "pv",
    Date.now(),
    crypto.randomUUID(),
  ].join("_");
}

function sendServerEvent(
  eventId: string,
) {
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
        eventName:
          "PageView",

        eventId,

        eventSourceUrl:
          window.location.href,
      }),

      keepalive: true,
    },
  ).catch(() => {
    // Browser tracking should continue
    // even if the server event fails.
  });
}

export function MetaPixel() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const pixelId =
    process.env
      .NEXT_PUBLIC_META_PIXEL_ID;

  const [
    consent,
    setConsent,
  ] =
    useState<ConsentChoice>(
      null,
    );

  const lastTrackedUrl =
    useRef<string | null>(
      null,
    );

  const routeKey =
    useMemo(() => {
      const query =
        searchParams.toString();

      return query
        ? `${pathname}?${query}`
        : pathname;
    }, [
      pathname,
      searchParams,
    ]);

  useEffect(() => {
    setConsent(
      getCookieConsent(),
    );

    function handleConsent(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<{
          choice?:
            ConsentChoice;
        }>;

      const choice =
        customEvent.detail
          ?.choice ?? null;

      setConsent(choice);

      if (
        choice ===
        "rejected"
      ) {
        lastTrackedUrl.current =
          null;
      }
    }

    window.addEventListener(
      "wellyura:cookie-consent",
      handleConsent,
    );

    return () => {
      window.removeEventListener(
        "wellyura:cookie-consent",
        handleConsent,
      );
    };
  }, []);

  useEffect(() => {
    if (
      consent !== "accepted" ||
      !pixelId
    ) {
      return;
    }

    if (
      lastTrackedUrl.current ===
      routeKey
    ) {
      return;
    }

    const eventId =
      createEventId();

    const fbq =
      initialiseMetaPixel(
        pixelId,
      );

    fbq(
      "track",
      "PageView",
      {},
      {
        eventID:
          eventId,
      },
    );

    sendServerEvent(
      eventId,
    );

    lastTrackedUrl.current =
      routeKey;
  }, [
    consent,
    pixelId,
    routeKey,
  ]);

  return null;
}