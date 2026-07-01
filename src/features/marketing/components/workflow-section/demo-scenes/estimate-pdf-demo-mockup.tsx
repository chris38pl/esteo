"use client";

import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const PDF_HERO_SRC = "/images/estimate-request/construction/hero-light.webp";

export function EstimatePdfDemoMockup({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const isPl = locale === "pl";

  return (
    <div
      className={cn(
        "pointer-events-none select-none overflow-hidden rounded-md bg-white text-[#1f2937] shadow-lg ring-1 ring-black/5",
        className,
      )}
      aria-hidden
    >
      <div className="origin-top-left scale-[0.42] sm:scale-[0.48]" style={{ width: 520 }}>
        <div className="bg-white p-4">
          <header className="mb-3 grid grid-cols-[1fr_140px] gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" className="size-8 rounded-full object-cover" />
                <span className="text-[15px] font-semibold text-[#0f172a]">Esteo Dev Workspace</span>
              </div>
              <div className="text-[7px] font-bold uppercase tracking-[0.14em] text-[#334155]">
                {isPl ? "Wycena" : "Estimate"}
              </div>
              <div className="text-[8px] font-medium text-[#2563eb]">ER-2026-00008</div>
              <div className="mt-1 space-y-0.5 text-[7px] text-[#0f172a]">
                <div>
                  {isPl ? "Data wystawienia:" : "Issue date:"} 13.06.2026
                </div>
                <div>
                  {isPl ? "Ważna do:" : "Valid until:"} 27.06.2026 (14 {isPl ? "dni" : "days"})
                </div>
              </div>
            </div>
            <div
              className="h-[74px] overflow-hidden rounded-r-md"
              style={{ clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PDF_HERO_SRC} alt="" className="h-full w-full object-cover" />
            </div>
          </header>

          <section className="mb-3 grid grid-cols-3 gap-2 text-[6.5px] leading-[1.45]">
            <InfoCol
              title={isPl ? "Dane usługodawcy" : "Provider"}
              lines={["Esteo Dev Workspace", "ul. Przykładowa 12", "00-001 Warszawa", "NIP: 1234567890"]}
            />
            <InfoCol
              title={isPl ? "Dane klienta" : "Client"}
              lines={["Mariusz Kowalski", "ul. Leśna 8/4", "40 m²", "m.kowalski@email.pl"]}
            />
            <InfoCol
              title={isPl ? "Inwestycja" : "Project"}
              lines={[isPl ? "Mieszkanie" : "Apartment", "ul. Leśna 8/4", "Warszawa"]}
            />
          </section>

          <section className="mb-3 rounded-lg bg-[#eff6ff] px-3 py-2">
            <div className="mb-1.5 text-[7px] font-semibold uppercase tracking-wide text-[#334155]">
              {isPl ? "Podsumowanie wyceny" : "Estimate summary"}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[6.5px]">
              <Metric label={isPl ? "Wartość netto" : "Net"} value="67 962,01 zł" />
              <Metric label="VAT (23%)" value="15 631,26 zł" />
              <Metric
                label={isPl ? "Wartość brutto" : "Gross"}
                value="83 593,27 zł"
                highlight
              />
              <Metric
                label={isPl ? "Termin realizacji" : "Lead time"}
                value={isPl ? "do uzgodnienia" : "TBD"}
              />
            </div>
          </section>

          <table className="w-full border-collapse text-[6px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-left text-[#64748b]">
                <th className="pb-1 pr-1 font-semibold">LP.</th>
                <th className="pb-1 pr-1 font-semibold">{isPl ? "Nazwa pozycji" : "Item"}</th>
                <th className="pb-1 pr-1 font-semibold">{isPl ? "Jedn." : "Unit"}</th>
                <th className="pb-1 pr-1 font-semibold">{isPl ? "Ilość" : "Qty"}</th>
                <th className="pb-1 font-semibold text-right">{isPl ? "Wartość netto" : "Net"}</th>
              </tr>
            </thead>
            <tbody>
              <SectionRow title={isPl ? "1. Prace rozbiórkowe" : "1. Demolition"} total="5 200,00 zł" />
              <ItemRow lp="1.1" name={isPl ? "Demontaż drzwi wewnętrznych" : "Interior door removal"} />
              <SectionRow title={isPl ? "2. Instalacje" : "2. Installations"} total="12 840,00 zł" />
              <ItemRow lp="2.1" name={isPl ? "Punkty elektryczne" : "Electrical points"} />
              <SectionRow title={isPl ? "3. Wykończenie łazienki" : "3. Bathroom finishing"} total="28 400,00 zł" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InfoCol({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2">
      <div className="mb-1 text-[6px] font-bold uppercase tracking-wide text-[#2563eb]">{title}</div>
      {lines.map((line) => (
        <div key={line} className="text-[#0f172a]">
          {line}
        </div>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[#64748b]">{label}</div>
      <div className={cn("mt-0.5 font-semibold", highlight ? "text-[#2563eb]" : "text-[#0f172a]")}>
        {value}
      </div>
    </div>
  );
}

function SectionRow({ title, total }: { title: string; total: string }) {
  return (
    <tr className="bg-[#f1f5f9] text-[6.5px] font-semibold text-[#0f172a]">
      <td colSpan={4} className="py-1 pl-1">
        {title}
      </td>
      <td className="py-1 pr-1 text-right">{total}</td>
    </tr>
  );
}

function ItemRow({ lp, name }: { lp: string; name: string }) {
  return (
    <tr className="border-b border-[#f1f5f9] text-[#334155]">
      <td className="py-1 pl-1">{lp}</td>
      <td className="py-1 pr-1">{name}</td>
      <td className="py-1">szt.</td>
      <td className="py-1">4</td>
      <td className="py-1 pr-1 text-right">720,00 zł</td>
    </tr>
  );
}
