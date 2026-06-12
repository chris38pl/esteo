import { scopeLabelsMatch } from "../../src/ai/lib/voice-intake-scope-terms.ts";

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function scoreCity(expected, actual) {
  if (expected === null) {
    return actual === null || actual === "" ? 1 : 0;
  }
  return normalize(expected) === normalize(actual) ? 1 : 0;
}

export function scoreArea(expected, actual) {
  if (expected === null) {
    return actual === null ? 1 : 0;
  }
  if (actual === null || !Number.isFinite(actual)) {
    return 0;
  }
  const tolerance = Math.max(1, expected * 0.05);
  return Math.abs(actual - expected) <= tolerance ? 1 : 0;
}

export function scoreEnum(expected, actual) {
  if (expected === null) {
    return actual === null ? 1 : 0;
  }
  return expected === actual ? 1 : 0;
}

export function scoreScopeOfWork(expected, actualItems) {
  if (!expected || expected.length === 0) {
    return (!actualItems || actualItems.length === 0) ? 1 : 0;
  }

  const actual = (actualItems ?? []).map((item) => String(item.label ?? item));

  const hits = expected.filter((expectedItem) =>
    actual.some((actualItem) => scopeLabelsMatch(expectedItem, actualItem)),
  );

  return hits.length / expected.length >= 0.8 ? 1 : hits.length / expected.length;
}

const AMBIGUITY_FIELDS = ["city", "area", "propertyType", "preferredStartDate"];

export function scoreAmbiguity(expected, extraction) {
  for (const field of AMBIGUITY_FIELDS) {
    const value =
      field === "propertyType"
        ? extraction.propertyType?.value ?? null
        : field === "city"
          ? extraction.city?.value ?? null
          : field === "area"
            ? extraction.area?.value ?? null
            : extraction.preferredStartDate?.value ?? null;

    if (value !== null && value !== "") {
      return 0;
    }
  }

  return 1;
}

export function scoreFixture(expected, extraction) {
  return {
    city: scoreCity(expected.city, extraction.city?.value ?? null),
    area: scoreArea(expected.area, extraction.area?.value ?? null),
    preferredStartDate: scoreEnum(
      expected.preferredStartDate,
      extraction.preferredStartDate?.value ?? null,
    ),
    propertyType: scoreEnum(expected.propertyType, extraction.propertyType?.value ?? null),
    scopeOfWork: scoreScopeOfWork(
      expected.scopeOfWork,
      extraction.scopeOfWork?.items ?? [],
    ),
  };
}
