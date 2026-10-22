import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

const CONSENT_COOKIE =
  "wellyura_cookie_consent_v2";

const GRAPH_API_VERSION =
  "v26.0";

const ALLOWED_EVENTS =
  new Set([
    "PageView",
    "Lead",
    "CompleteRegistration",
  ]);

type EventRequest = {
  eventName?: string;
  eventId?: string;
  eventSourceUrl?: string;
};

function getClientIp(
  request: NextRequest,
) {
  const forwarded =
    request.headers.get(
      "x-forwarded-for",
    );

  if (forwarded) {
    return forwarded
      .split(",")[0]
      ?.trim();
  }

  return (
    request.headers
      .get("x-real-ip")
      ?.trim() ||
    undefined
  );
}

export async function POST(
  request: NextRequest,
) {
  const consent =
    request.cookies.get(
      CONSENT_COOKIE,
    )?.value;

  if (consent !== "accepted") {
    return NextResponse.json(
      {
        ok: false,
        reason: "consent_required",
      },
      {
        status: 403,
      },
    );
  }

  const accessToken =
    process.env
      .META_CONVERSIONS_API_TOKEN;

  const datasetId =
    process.env
      .NEXT_PUBLIC_META_PIXEL_ID;

  if (
    !accessToken ||
    !datasetId
  ) {
    console.error(
      "Meta CAPI configuration is missing.",
    );

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 503,
      },
    );
  }

  let body: EventRequest;

  try {
    body =
      (await request.json()) as
        EventRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_json",
      },
      {
        status: 400,
      },
    );
  }

  const eventName =
    body.eventName?.trim();

  const eventId =
    body.eventId?.trim();

  const eventSourceUrl =
    body.eventSourceUrl?.trim();

  if (
    !eventName ||
    !ALLOWED_EVENTS.has(
      eventName,
    ) ||
    !eventId ||
    eventId.length < 8 ||
    eventId.length > 200 ||
    !eventSourceUrl
  ) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_event",
      },
      {
        status: 400,
      },
    );
  }

  let parsedSourceUrl: URL;

  try {
    parsedSourceUrl =
      new URL(
        eventSourceUrl,
      );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason:
          "invalid_source_url",
      },
      {
        status: 400,
      },
    );
  }

  const allowedOrigins =
    new Set([
      request.nextUrl.origin,
      "https://www.wellyura.com",
    ]);

  if (
    !allowedOrigins.has(
      parsedSourceUrl.origin,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          "invalid_source_origin",
      },
      {
        status: 400,
      },
    );
  }

  const userData:
    Record<string, string> = {};

  const clientIp =
    getClientIp(request);

  const userAgent =
    request.headers
      .get("user-agent")
      ?.trim();

  const fbp =
    request.cookies
      .get("_fbp")
      ?.value
      .trim();

  const fbc =
    request.cookies
      .get("_fbc")
      ?.value
      .trim();

  if (clientIp) {
    userData.client_ip_address =
      clientIp;
  }

  if (userAgent) {
    userData.client_user_agent =
      userAgent;
  }

  if (fbp) {
    userData.fbp = fbp;
  }

  if (fbc) {
    userData.fbc = fbc;
  }

  const metaEvent = {
    event_name: eventName,

    event_time:
      Math.floor(
        Date.now() / 1000,
      ),

    event_id: eventId,

    action_source:
      "website",

    event_source_url:
      parsedSourceUrl.toString(),

    user_data: userData,
  };

  const metaPayload: {
    data: typeof metaEvent[];
    test_event_code?: string;
  } = {
    data: [
      metaEvent,
    ],
  };

  const testEventCode =
    process.env
      .META_TEST_EVENT_CODE
      ?.trim();

  if (testEventCode) {
    metaPayload.test_event_code =
      testEventCode;
  }

  const endpoint =
    new URL(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/events`,
    );

  endpoint.searchParams.set(
    "access_token",
    accessToken,
  );

  try {
    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              metaPayload,
            ),

          cache: "no-store",
        },
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Meta CAPI request failed:",
        response.status,
        errorText,
      );

      return NextResponse.json(
        {
          ok: false,
        },
        {
          status: 502,
        },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Meta CAPI network error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 502,
      },
    );
  }
}