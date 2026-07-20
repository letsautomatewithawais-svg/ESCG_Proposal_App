// Hand-written to mirror database-updates.sql (no Supabase CLI/dashboard access
// to run `supabase gen types`). Keep in sync whenever that file changes.

export type ProposalStatus = "Draft" | "Sent" | "Opened" | "Signed" | "Lost";

type ProposalRow = {
  id: string;
  status: ProposalStatus;
  walkThroughDate: string;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientEmail: string;
  frequencyOfService: string;
  schedulingDay: string | null;
  schedulingTime: string | null;
  scopeOfWork: string;
  pricePerVisit: number;
  monthlyCostExclGst: number;
  totalMonthlyInclGst: number;
  acquisitionMethod: string;
  createdAt: string;
  updatedAt: string;
};
// id and updatedAt have no DB default — Prisma used to set both client-side,
// so callers must keep supplying them explicitly.
type ProposalInsert = Omit<ProposalRow, "status" | "createdAt"> & {
  status?: ProposalStatus;
  createdAt?: string;
};
type ProposalUpdate = Partial<ProposalRow>;

type SignatureRow = {
  id: string;
  proposalId: string;
  signatureImage: string;
  typedName: string;
  signedAt: string;
  ipAddress: string | null;
  createdAt: string;
};
type SignatureInsert = Omit<SignatureRow, "signedAt" | "createdAt"> & {
  signedAt?: string;
  createdAt?: string;
};
type SignatureUpdate = Partial<SignatureRow>;

type ProposalViewRow = {
  id: string;
  proposalId: string;
  firstOpenAt: string;
  lastSeenAt: string;
  totalSeconds: number;
  openCount: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
};
type ProposalViewInsert = Omit<ProposalViewRow, "totalSeconds" | "openCount" | "createdAt"> & {
  totalSeconds?: number;
  openCount?: number;
  createdAt?: string;
};
type ProposalViewUpdate = Partial<ProposalViewRow>;

type SectionViewRow = {
  id: string;
  proposalId: string;
  sectionName: string;
  firstViewedAt: string;
  totalSeconds: number;
  createdAt: string;
};
type SectionViewInsert = Omit<SectionViewRow, "totalSeconds" | "createdAt"> & {
  totalSeconds?: number;
  createdAt?: string;
};
type SectionViewUpdate = Partial<SectionViewRow>;

type ProposalVisitRow = {
  id: string;
  proposalId: string;
  startedAt: string;
  lastSeenAt: string;
  totalSeconds: number;
  createdAt: string;
};
type ProposalVisitInsert = Omit<ProposalVisitRow, "startedAt" | "lastSeenAt" | "totalSeconds" | "createdAt"> & {
  startedAt?: string;
  lastSeenAt?: string;
  totalSeconds?: number;
  createdAt?: string;
};
type ProposalVisitUpdate = Partial<ProposalVisitRow>;

type LoginAttemptRow = {
  ip: string;
  failCount: number;
  lockedUntil: string | null;
  updatedAt: string;
};
type LoginAttemptInsert = Omit<LoginAttemptRow, "failCount"> & {
  failCount?: number;
};
type LoginAttemptUpdate = Partial<LoginAttemptRow>;

export type Database = {
  public: {
    Tables: {
      Proposal: {
        Row: ProposalRow;
        Insert: ProposalInsert;
        Update: ProposalUpdate;
        Relationships: [];
      };
      Signature: {
        Row: SignatureRow;
        Insert: SignatureInsert;
        Update: SignatureUpdate;
        Relationships: [];
      };
      ProposalView: {
        Row: ProposalViewRow;
        Insert: ProposalViewInsert;
        Update: ProposalViewUpdate;
        Relationships: [];
      };
      SectionView: {
        Row: SectionViewRow;
        Insert: SectionViewInsert;
        Update: SectionViewUpdate;
        Relationships: [];
      };
      ProposalVisit: {
        Row: ProposalVisitRow;
        Insert: ProposalVisitInsert;
        Update: ProposalVisitUpdate;
        Relationships: [];
      };
      LoginAttempt: {
        Row: LoginAttemptRow;
        Insert: LoginAttemptInsert;
        Update: LoginAttemptUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      // Atomic increment/upsert RPCs — see database-updates.sql's
      // "2026-07-19 (2)" section for why these replaced select-then-update
      // calls in app/api/proposals/[uuid]/track/route.ts.
      record_proposal_open: {
        Args: { p_proposal_id: string; p_ip: string | null; p_user_agent: string | null };
        Returns: void;
      };
      increment_proposal_view_seconds: {
        Args: { p_proposal_id: string; p_delta: number };
        Returns: void;
      };
      increment_section_view_seconds: {
        Args: { p_proposal_id: string; p_section_name: string; p_delta: number };
        Returns: void;
      };
      record_proposal_visit: {
        Args: { p_visit_id: string; p_proposal_id: string };
        Returns: void;
      };
      increment_proposal_visit_seconds: {
        Args: { p_visit_id: string; p_delta: number };
        Returns: void;
      };
    };
    Enums: {
      ProposalStatus: ProposalStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
