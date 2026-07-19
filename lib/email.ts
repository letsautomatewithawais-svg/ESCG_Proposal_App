// Sends proposal emails via the Microsoft Graph API, as the client's own
// Microsoft 365 mailbox (tory@easternsuburbscleaninggroup.com.au) — not a
// third-party relay. Graph, not SMTP: Microsoft has been disabling Basic
// Auth for SMTP AUTH client submission tenant-wide, so a plain
// username/password SMTP setup is likely to be blocked outright on a real
// client tenant. App-only auth (client credentials flow) needs no
// interactive login and is Microsoft's own recommended path for a backend
// service sending as a specific mailbox.
//
// Every Microsoft-specific value is an env var (MS_TENANT_ID, MS_CLIENT_ID,
// MS_CLIENT_SECRET, MS_SENDER_EMAIL) — swapping from a test tenant/mailbox
// to the client's real ones is a config change only, never a code change.
// See the comments above these vars in .env.local for what each one is and
// where it comes from (Azure Portal app registration).

type SendProposalEmailParams = {
  clientName: string;
  clientEmail: string;
  proposalUrl: string;
  companyName: string;
};

function buildHtml({ clientName, proposalUrl, companyName }: SendProposalEmailParams): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <p style="font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
      <p style="font-size: 16px; line-height: 1.6;">
        Eastern Suburbs Cleaning Group is pleased to provide the following proposal for ${companyName}.
      </p>
      <p style="margin: 32px 0;">
        <a
          href="${proposalUrl}"
          style="background-color: #4a5d4a; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;"
        >
          View Your Proposal
        </a>
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #555555;">
        Or copy and paste this link into your browser:<br />
        <a href="${proposalUrl}" style="color: #4a5d4a;">${proposalUrl}</a>
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin-top: 32px;">
        Kind regards,<br />
        Tory<br />
        Eastern Suburbs Cleaning Group
      </p>
    </div>
  `;
}

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

// Cached across invocations within the same warm serverless instance —
// avoids a token round-trip on every single email. A cold start just means
// one extra fetch; harmless at this app's volume.
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getGraphAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph email is not configured — set MS_TENANT_ID, MS_CLIENT_ID, and MS_CLIENT_SECRET.",
    );
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      // Application-permission (app-only) scope — no signed-in user/refresh
      // token involved, matches the Mail.Send Application permission granted
      // on the app registration.
      scope: "https://graph.microsoft.com/.default",
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Microsoft Graph auth failed: ${json?.error_description ?? json?.error ?? res.statusText}`,
    );
  }

  cachedToken = {
    accessToken: json.access_token,
    expiresAt: now + (typeof json.expires_in === "number" ? json.expires_in : 3600) * 1000,
  };
  return cachedToken.accessToken;
}

export async function sendProposalEmail(params: SendProposalEmailParams) {
  const { clientEmail, companyName, clientName } = params;
  const senderEmail = process.env.MS_SENDER_EMAIL;

  try {
    if (!senderEmail) {
      throw new Error("Microsoft Graph email is not configured — set MS_SENDER_EMAIL.");
    }

    const accessToken = await getGraphAccessToken();

    // Sends AS senderEmail's own mailbox — the "from" address is whichever
    // mailbox this endpoint is called on, not a separate field in the
    // message body. Requires the app registration to hold the Mail.Send
    // Application permission (with admin consent) in that mailbox's tenant.
    const res = await fetch(
      `${GRAPH_BASE_URL}/users/${encodeURIComponent(senderEmail)}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: "Your cleaning service proposal from ESCG",
            body: { contentType: "HTML", content: buildHtml(params) },
            toRecipients: [{ emailAddress: { address: clientEmail } }],
          },
          saveToSentItems: true,
        }),
      },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const message =
        typeof json?.error?.message === "string" ? json.error.message : res.statusText;
      console.error("Microsoft Graph failed to send proposal email:", {
        clientEmail,
        companyName,
        clientName,
        status: res.status,
        message,
      });
      return { success: false, error: new Error(message) };
    }

    console.log("Proposal email sent successfully via Microsoft Graph:", {
      clientEmail,
      companyName,
      clientName,
    });
    return { success: true, data: null };
  } catch (err) {
    console.error("Unexpected error sending proposal email:", {
      clientEmail,
      companyName,
      clientName,
      error: err,
    });
    return { success: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
