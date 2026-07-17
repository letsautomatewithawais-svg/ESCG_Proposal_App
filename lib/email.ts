import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function sendProposalEmail(params: SendProposalEmailParams) {
  const { clientName, clientEmail, companyName } = params;

  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: clientEmail,
      subject: `Your cleaning service proposal from ESCG`,
      html: buildHtml(params),
    });

    if (response.error) {
      console.error("Resend failed to send proposal email:", {
        clientEmail,
        companyName,
        clientName,
        error: response.error,
      });
      return { success: false, error: response.error };
    }

    console.log("Proposal email sent successfully:", {
      clientEmail,
      companyName,
      clientName,
      data: response.data,
    });
    return { success: true, data: response.data };
  } catch (err) {
    console.error("Unexpected error sending proposal email:", {
      clientEmail,
      companyName,
      clientName,
      error: err,
    });
    return { success: false, error: err };
  }
}
