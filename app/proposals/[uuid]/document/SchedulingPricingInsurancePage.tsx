import { DocumentPage } from "./DocumentPage";
import { INSURANCE_ROWS } from "./content";

type SchedulingPricingInsurancePageProps = {
  frequencyOfService: string;
  schedulingDay: string | null;
  schedulingTime: string | null;
  walkThroughDateDisplay: string;
  pricePerVisitDisplay: string;
  monthlyCostExclGstDisplay: string;
  totalMonthlyInclGstDisplay: string;
};

export function SchedulingPricingInsurancePage({
  frequencyOfService,
  schedulingDay,
  schedulingTime,
  walkThroughDateDisplay,
  pricePerVisitDisplay,
  monthlyCostExclGstDisplay,
  totalMonthlyInclGstDisplay,
}: SchedulingPricingInsurancePageProps) {
  const schedulingDetail = [frequencyOfService, schedulingDay, schedulingTime]
    .filter(Boolean)
    .join(" - ");

  return (
    <DocumentPage>
      <div id="section-scheduling">
        <h2 className="font-display text-xl font-bold text-escg-navy">Scheduling</h2>
        <p className="mt-3 text-sm text-escg-text">{schedulingDetail}</p>
        <p className="mt-1 text-xs text-escg-muted">
          Walk-through scheduled for {walkThroughDateDisplay}
        </p>
      </div>

      <div id="section-pricing">
        <h2 className="mt-10 font-display text-xl font-bold text-escg-navy">Pricing</h2>
        <div className="mt-4 overflow-hidden rounded-[4px] border border-escg-hairline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-escg-navy text-left text-white">
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 text-right font-semibold">Price Per Month Excl GST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-escg-hairline">
              <tr>
                <td className="px-4 py-3 text-escg-text">Per Visit Cost</td>
                <td className="px-4 py-3 text-right text-escg-text">{pricePerVisitDisplay}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-escg-text">Monthly Cleaning Services</td>
                <td className="px-4 py-3 text-right text-escg-text">{monthlyCostExclGstDisplay}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-escg-navy">GST</td>
                <td className="px-4 py-3 text-right font-semibold text-escg-navy">10%</td>
              </tr>
              <tr className="bg-escg-teal-tint">
                <td className="px-4 py-3 font-semibold text-escg-navy">Monthly Invoice</td>
                <td className="px-4 py-3 text-right font-semibold text-escg-navy">
                  {totalMonthlyInclGstDisplay}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-escg-muted">
          Payment terms for this quotation are based upon a total per annum price divided into 12
          equal monthly
        </p>
      </div>

      <div id="section-insurance">
        <h2 className="mt-10 font-display text-xl font-bold text-escg-navy">Our Insurances</h2>
        <div className="mt-4 overflow-hidden rounded-[4px] border border-escg-hairline">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-escg-navy text-left text-white">
                <th className="px-3 py-3 font-semibold">Policy Type</th>
                <th className="px-3 py-3 font-semibold">Coverage</th>
                <th className="px-3 py-3 font-semibold">Insurer</th>
                <th className="px-3 py-3 font-semibold">Policy Number</th>
                <th className="px-3 py-3 font-semibold">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-escg-hairline">
              {INSURANCE_ROWS.map((row) => (
                <tr key={row.policyType}>
                  <td className="px-3 py-3 text-escg-text">{row.policyType}</td>
                  <td className="px-3 py-3 text-escg-text">{row.coverage}</td>
                  <td className="px-3 py-3 text-escg-text">{row.insurer}</td>
                  <td className="px-3 py-3 text-escg-text">{row.policyNumber}</td>
                  <td className="px-3 py-3 text-escg-text">{row.expiryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DocumentPage>
  );
}
