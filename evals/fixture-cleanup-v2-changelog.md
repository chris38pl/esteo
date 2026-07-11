# Fixture cleanup v2 changelog

Generated: 2026-06-19T08:35:59.219Z

Source of truth: `evals/scripts/seed-services-scenarios.ts`

### copywriter
- **Brief:** Teksty na nową stronę firmową SaaS, 8 podstron + 4 artykuły blogowe, ton profesjonalny.
- **Removed coverageTerms:** case study
- **Rationale:** termin nie występuje w briefie klienta.

### marketing-agency
- **Brief:** Kampania wprowadzenia nowego produktu SaaS na rynek polski, 3 miesiące, budżet mediowy po stronie klienta, potrzebuję strategii i kreacji.
- **Removed coverageTerms:** content
- **Removed mustHave:** content
- **Rationale:** termin nie występuje w briefie klienta.

### recruitment-agency
- **Brief:** Rekrutacja Senior Backend Developera, Node.js, proces 4 etapów, start ASAP.
- **Removed coverageTerms:** sourcing, interview
- **Removed mustHave:** sourcing, interview
- **Rationale:** termin nie występuje w briefie klienta.

### personal-trainer
- **Brief:** Trening personalny 2x w tygodniu przez 3 miesiące, plan ćwiczeń domowych, Warszawa Mokotów.
- **Removed coverageTerms:** sesja
- **Removed mustHave:** sesj
- **Rationale:** termin nie występuje w briefie klienta.

### it-consulting
- **Brief:** Audyt architektury systemu ERP przed migracją do chmury, 80 użytkowników, warsztaty z zespołem IT klienta.
- **Removed coverageTerms:** roadmap
- **Rationale:** termin nie występuje w briefie klienta.

### graphic-designer
- **Brief:** Rebranding logo i podstawowych materiałów firmowych dla startupu fintech, 2 rundy poprawek.
- **Removed coverageTerms:** druk
- **Rationale:** termin nie występuje w briefie klienta.

### law-firm
- **Brief:** Potrzebuję przygotowania i negocjacji umowy najmu lokalu użytkowego 200 m² w Warszawie, z terminem 2 miesięcy.
- **Removed coverageTerms:** prawn
- **Removed mustHave:** prawn, konsultac
- **Rationale:** termin nie występuje w briefie klienta.

### generic-konsulting
- **Brief:** Audyt procesów sprzedaży i 2-dniowe warsztaty strategiczne dla zarządu (8 osób), Kraków.
- **Removed coverageTerms:** konsult
- **Rationale:** termin nie występuje w briefie klienta.

### language-school
- **Brief:** Kurs angielskiego biznesowego dla zespołu 8 osób, 2x w tygodniu, poziom B1-B2, 4 miesiące.
- **Removed coverageTerms:** zajęcia
- **Rationale:** termin nie występuje w briefie klienta.

## Skipped (protected)

| Scenario | Term | Reason |
| --- | --- | --- |
| law-firm | najem | matcher_deficiency |
| cleaning-company | okna | matcher_deficiency |
| copywriter | copy | matcher_deficiency |
| accounting-office | faktur | prompt_gap |

## Dual coverage + mustHave removals

- **marketing-agency** - coverage: content; mustHave: content
- **recruitment-agency** - coverage: sourcing, interview; mustHave: sourcing, interview
- **personal-trainer** - coverage: sesja; mustHave: sesj
- **law-firm** - coverage: prawn; mustHave: prawn, konsultac
