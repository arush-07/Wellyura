import {
  withSupabase,
} from "npm:@supabase/server";

type AlertRow = {
  delivery_id: string;
  recipient: string;
  recipient_name: string | null;
  notification_type: string;
  subject: string;
  message: string;
  action_url: string | null;
};

type ResendResult = {
  id?: string;
  message?: string;
  name?: string;
  error?: {
    message?: string;
  };
};

function json(
  body: unknown,
  status = 200,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveActionUrl(
  appUrl: string,
  actionUrl: string | null,
) {
  const baseUrl =
    appUrl.replace(/\/+$/, "");

  if (!actionUrl) {
    return baseUrl;
  }

  if (
    actionUrl.startsWith("https://") ||
    actionUrl.startsWith("http://")
  ) {
    return actionUrl;
  }

  return `${baseUrl}${
    actionUrl.startsWith("/")
      ? actionUrl
      : `/${actionUrl}`
  }`;
}

function createEmailHtml(
  alert: AlertRow,
  appUrl: string,
) {
  const recipientName =
    alert.recipient_name?.trim() ||
    "Student";

  const actionUrl =
    resolveActionUrl(
      appUrl,
      alert.action_url,
    );

  const safeName =
    escapeHtml(recipientName);

  const safeSubject =
    escapeHtml(alert.subject);

  const safeMessage =
    escapeHtml(alert.message)
      .replaceAll("\n", "<br />");

  const safeActionUrl =
    escapeHtml(actionUrl);

  const category =
    escapeHtml(
      alert.notification_type
        .replaceAll("_", " ")
        .toUpperCase(),
    );

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>${safeSubject}</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #f3f7f5;
      color: #173b31;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="
        width: 100%;
        background: #f3f7f5;
        padding: 32px 14px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="600"
            cellspacing="0"
            cellpadding="0"
            style="
              width: 100%;
              max-width: 600px;
              overflow: hidden;
              border: 1px solid #dce8e3;
              border-radius: 22px;
              background: #ffffff;
            "
          >
            <tr>
              <td
                style="
                  padding: 30px 34px;
                  background: #173b31;
                  color: #ffffff;
                "
              >
                <div
                  style="
                    margin-bottom: 18px;
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.4px;
                  "
                >
                  Wellyura
                </div>

                <div
                  style="
                    color: #b8d4ca;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1.2px;
                  "
                >
                  ${category}
                </div>

                <h1
                  style="
                    margin: 8px 0 0;
                    color: #ffffff;
                    font-size: 28px;
                    line-height: 1.25;
                  "
                >
                  ${safeSubject}
                </h1>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 34px;
                "
              >
                <p
                  style="
                    margin: 0 0 18px;
                    color: #173b31;
                    font-size: 16px;
                    line-height: 1.7;
                  "
                >
                  Hello ${safeName},
                </p>

                <p
                  style="
                    margin: 0;
                    color: #50635c;
                    font-size: 15px;
                    line-height: 1.75;
                  "
                >
                  ${safeMessage}
                </p>

                ${
                  alert.action_url
                    ? `
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  style="margin-top: 28px;"
                >
                  <tr>
                    <td
                      style="
                        border-radius: 12px;
                        background: #173b31;
                      "
                    >
                      <a
                        href="${safeActionUrl}"
                        style="
                          display: inline-block;
                          padding: 13px 20px;
                          color: #ffffff;
                          font-size: 14px;
                          font-weight: 700;
                          text-decoration: none;
                        "
                      >
                        Open Wellyura
                      </a>
                    </td>
                  </tr>
                </table>
                `
                    : ""
                }

                <p
                  style="
                    margin: 30px 0 0;
                    padding-top: 22px;
                    border-top: 1px solid #e5ece9;
                    color: #7a8984;
                    font-size: 12px;
                    line-height: 1.6;
                  "
                >
                  You received this email because
                  email notifications are enabled
                  in your Wellyura alert settings.
                </p>
              </td>
            </tr>
          </table>

          <p
            style="
              margin: 18px 0 0;
              color: #87958f;
              font-size: 11px;
            "
          >
            © ${new Date().getUTCFullYear()}
            Wellyura
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function resendError(
  result: ResendResult,
  status: number,
) {
  return (
    result.message ||
    result.error?.message ||
    result.name ||
    `Resend request failed with status ${status}`
  );
}

function wait(milliseconds: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );
}

export default {
  fetch: withSupabase(
    {
      auth: "secret:automations",
    },

    async (request, context) => {
      if (request.method !== "POST") {
        return json(
          {
            error: "Method not allowed",
          },
          405,
        );
      }

      const resendApiKey =
        Deno.env.get("RESEND_API_KEY");

      const fromEmail =
        Deno.env.get(
          "ALERT_FROM_EMAIL",
        );

      const appUrl =
        Deno.env.get("APP_URL");

      if (
        !resendApiKey ||
        !fromEmail ||
        !appUrl
      ) {
        return json(
          {
            error:
              "Required email secrets are missing.",
          },
          500,
        );
      }

      let batchSize = 25;

      try {
        const body =
          await request.json();

        const requestedSize =
          Number(body?.batch_size);

        if (
          Number.isFinite(requestedSize)
        ) {
          batchSize = Math.max(
            1,
            Math.min(
              100,
              Math.floor(requestedSize),
            ),
          );
        }
      } catch {
        // An empty request body uses
        // the default batch size.
      }

      const {
        data,
        error,
      } =
        await context.supabaseAdmin.rpc(
          "claim_email_alerts",
          {
            batch_size: batchSize,
          },
        );

      if (error) {
        console.error(
          "Could not claim email alerts:",
          error,
        );

        return json(
          {
            error: error.message,
          },
          500,
        );
      }

      const alerts =
        (data ?? []) as AlertRow[];

      let sent = 0;
      let failed = 0;

      const failures: Array<{
        delivery_id: string;
        recipient: string;
        error: string;
      }> = [];

      for (const alert of alerts) {
        try {
          const actionUrl =
            resolveActionUrl(
              appUrl,
              alert.action_url,
            );

          const response =
            await fetch(
              "https://api.resend.com/emails",
              {
                method: "POST",

                headers: {
                  Authorization:
                    `Bearer ${resendApiKey}`,

                  "Content-Type":
                    "application/json",

                  "Idempotency-Key":
                    `wellyura/${alert.delivery_id}`,
                },

                body: JSON.stringify({
                  from: fromEmail,

                  to: [
                    alert.recipient,
                  ],

                  subject:
                    alert.subject,

                  text: [
                    `Hello ${
                      alert.recipient_name ||
                      "Student"
                    },`,
                    "",
                    alert.message,
                    "",
                    alert.action_url
                      ? `Open Wellyura: ${actionUrl}`
                      : "",
                    "",
                    "You received this email because email notifications are enabled in your Wellyura alert settings.",
                  ]
                    .filter(Boolean)
                    .join("\n"),

                  html:
                    createEmailHtml(
                      alert,
                      appUrl,
                    ),
                }),
              },
            );

          const result =
            await response
              .json()
              .catch(
                () =>
                  ({}) as ResendResult,
              ) as ResendResult;

          if (!response.ok) {
            throw new Error(
              resendError(
                result,
                response.status,
              ),
            );
          }

          const providerMessageId =
            result.id || null;

          const {
            error: updateError,
          } =
            await context.supabaseAdmin
              .from(
                "notification_deliveries",
              )
              .update({
                status: "sent",

                provider_message_id:
                  providerMessageId,

                error_message: null,

                sent_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                alert.delivery_id,
              );

          if (updateError) {
            throw new Error(
              `Email sent, but delivery status could not be saved: ${updateError.message}`,
            );
          }

          sent += 1;
        } catch (sendError) {
          const message =
            errorMessage(sendError);

          failed += 1;

          failures.push({
            delivery_id:
              alert.delivery_id,

            recipient:
              alert.recipient,

            error: message,
          });

          console.error(
            "Email delivery failed:",
            {
              delivery_id:
                alert.delivery_id,

              recipient:
                alert.recipient,

              error: message,
            },
          );

          const {
            error: failureUpdateError,
          } =
            await context.supabaseAdmin
              .from(
                "notification_deliveries",
              )
              .update({
                status: "failed",

                provider_message_id:
                  null,

                error_message:
                  message,

                sent_at: null,
              })
              .eq(
                "id",
                alert.delivery_id,
              );

          if (failureUpdateError) {
            console.error(
              "Could not save failed delivery:",
              failureUpdateError,
            );
          }
        }

        // Keep individual sends below
        // common provider rate limits.
        await wait(550);
      }

      return json({
        claimed: alerts.length,
        sent,
        failed,
        failures,
      });
    },
  ),
};
