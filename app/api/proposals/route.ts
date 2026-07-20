import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase";
import { sendProposalEmail } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST_MULTIPLIER = 1.1;

type ProposalPayload = {
  walkThroughDate: string;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientEmail: string;
  frequencyOfService: string;
  schedulingDay?: string;
  schedulingTime?: string;
  scopeOfWork: string;
  pricePerVisit: number;
  monthlyCostExclGst: number;
  acquisitionMethod: string;
  sendMode: "send_now" | "save_draft";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validate(body: unknown): Record<string, string> {
  if (!isRecord(body)) {
    return { _form: "Request body must be a JSON object." };
  }

  const errors: Record<string, string> = {};
  const str = (key: string) =>
    typeof body[key] === "string" ? (body[key] as string).trim() : "";

  if (!str("companyName")) errors.companyName = "Company name is required.";
  if (!str("companyAddress")) errors.companyAddress = "Company address is required.";
  if (!str("clientName")) errors.clientName = "Client's name is required.";
  if (!str("frequencyOfService")) {
    errors.frequencyOfService = "Frequency of service is required.";
  }
  if (!str("scopeOfWork")) errors.scopeOfWork = "Scope of work is required.";
  if (!str("acquisitionMethod")) {
    errors.acquisitionMethod = "Client acquisition method is required.";
  }

  const walkThroughDateRaw = body.walkThroughDate;
  if (
    typeof walkThroughDateRaw !== "string" ||
    !walkThroughDateRaw ||
    Number.isNaN(Date.parse(walkThroughDateRaw))
  ) {
    errors.walkThroughDate = "A valid walk-through date is required.";
  }

  const email = str("clientEmail");
  if (!email) {
    errors.clientEmail = "Client email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.clientEmail = "Enter a valid email address.";
  }

  const pricePerVisit = body.pricePerVisit;
  if (
    typeof pricePerVisit !== "number" ||
    !Number.isFinite(pricePerVisit) ||
    pricePerVisit <= 0
  ) {
    errors.pricePerVisit = "Price per visit must be a positive number.";
  }

  const monthlyCostExclGst = body.monthlyCostExclGst;
  if (
    typeof monthlyCostExclGst !== "number" ||
    !Number.isFinite(monthlyCostExclGst) ||
    monthlyCostExclGst < 0
  ) {
    errors.monthlyCostExclGst = "Monthly cost must be a valid number.";
  }

  const sendMode = body.sendMode;
  if (sendMode !== "send_now" && sendMode !== "save_draft") {
    errors.sendMode = "Send mode must be 'send_now' or 'save_draft'.";
  }

  return errors;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const errors = validate(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const data = body as ProposalPayload;
  const id = uuidv4();

  try {
    const { data: proposal, error } = await supabaseAdmin
      .from("Proposal")
      .insert({
        id,
        status: data.sendMode === "send_now" ? "Sent" : "Draft",
        walkThroughDate: new Date(data.walkThroughDate).toISOString(),
        companyName: data.companyName.trim(),
        companyAddress: data.companyAddress.trim(),
        clientName: data.clientName.trim(),
        clientEmail: data.clientEmail.trim(),
        frequencyOfService: data.frequencyOfService,
        schedulingDay: data.schedulingDay?.trim() || null,
        schedulingTime: data.schedulingTime?.trim() || null,
        scopeOfWork: data.scopeOfWork.trim(),
        pricePerVisit: data.pricePerVisit,
        monthlyCostExclGst: data.monthlyCostExclGst,
        totalMonthlyInclGst:
          Math.round(data.monthlyCostExclGst * GST_MULTIPLIER * 100) / 100,
        acquisitionMethod: data.acquisitionMethod,
        // No DB default for updatedAt (unlike Prisma, which set this client-side) — must set explicitly.
        updatedAt: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;

    let emailSent: boolean | undefined;
    if (data.sendMode === "send_now") {
      const proposalUrl = new URL(`/proposals/${proposal.id}`, request.url).toString();
      const result = await sendProposalEmail({
        clientName: data.clientName.trim(),
        clientEmail: data.clientEmail.trim(),
        proposalUrl,
        companyName: data.companyName.trim(),
      });
      emailSent = result.success;
    }

    return NextResponse.json({ id: proposal.id, emailSent }, { status: 201 });
  } catch (err) {
    console.error("Failed to create proposal:", err);
    return NextResponse.json(
      { error: "Something went wrong, please try again." },
      { status: 500 },
    );
  }
}
