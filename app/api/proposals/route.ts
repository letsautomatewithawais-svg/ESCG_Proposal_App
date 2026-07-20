import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { isValidSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendProposalEmail } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST_MULTIPLIER = 1.1;
// pricePerVisit/monthlyCostExclGst/totalMonthlyInclGst are all Decimal(10,2)
// columns (max 99,999,999.99) — capped well below that so monthlyCostExclGst
// * GST_MULTIPLIER can never overflow totalMonthlyInclGst's own column limit.
const MAX_MONEY_VALUE = 9_999_999.99;
// companyName/clientName render prominently on the cover page (title, "Prepared
// For" table) — an unbounded value visibly distorts that layout.
const MAX_NAME_LENGTH = 100;
// Date.parse() happily accepts wildly out-of-range years (e.g. a mistyped
// input can parse as year 60801) as "valid" — bound to a sane real-world
// range instead of just checking it's parseable at all.
const MIN_WALKTHROUGH_YEAR = 2000;
const MAX_WALKTHROUGH_YEAR = 2100;

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
  else if (str("companyName").length > MAX_NAME_LENGTH) {
    errors.companyName = `Company name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  if (!str("companyAddress")) errors.companyAddress = "Company address is required.";
  if (!str("clientName")) errors.clientName = "Client's name is required.";
  else if (str("clientName").length > MAX_NAME_LENGTH) {
    errors.clientName = `Client name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  if (!str("frequencyOfService")) {
    errors.frequencyOfService = "Frequency of service is required.";
  }
  if (!str("scopeOfWork")) errors.scopeOfWork = "Scope of work is required.";
  if (!str("acquisitionMethod")) {
    errors.acquisitionMethod = "Client acquisition method is required.";
  }

  const walkThroughDateRaw = body.walkThroughDate;
  const walkThroughDateMs =
    typeof walkThroughDateRaw === "string" ? Date.parse(walkThroughDateRaw) : NaN;
  if (
    typeof walkThroughDateRaw !== "string" ||
    !walkThroughDateRaw ||
    Number.isNaN(walkThroughDateMs)
  ) {
    errors.walkThroughDate = "A valid walk-through date is required.";
  } else {
    const year = new Date(walkThroughDateMs).getUTCFullYear();
    if (year < MIN_WALKTHROUGH_YEAR || year > MAX_WALKTHROUGH_YEAR) {
      errors.walkThroughDate = `Walk-through date must be between ${MIN_WALKTHROUGH_YEAR} and ${MAX_WALKTHROUGH_YEAR}.`;
    }
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
  } else if (pricePerVisit > MAX_MONEY_VALUE) {
    errors.pricePerVisit = `Price per visit must be ${MAX_MONEY_VALUE.toLocaleString()} or less.`;
  }

  const monthlyCostExclGst = body.monthlyCostExclGst;
  if (
    typeof monthlyCostExclGst !== "number" ||
    !Number.isFinite(monthlyCostExclGst) ||
    monthlyCostExclGst < 0
  ) {
    errors.monthlyCostExclGst = "Monthly cost must be a valid number.";
  } else if (monthlyCostExclGst > MAX_MONEY_VALUE) {
    errors.monthlyCostExclGst = `Monthly cost must be ${MAX_MONEY_VALUE.toLocaleString()} or less.`;
  }

  const sendMode = body.sendMode;
  if (sendMode !== "send_now" && sendMode !== "save_draft") {
    errors.sendMode = "Send mode must be 'send_now' or 'save_draft'.";
  }

  return errors;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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
