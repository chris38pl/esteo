import type { FormFieldPath } from "@/features/voice-intake/lib/apply-field-sequence";
import { getValueAtPath } from "@/features/voice-intake/lib/apply-field-sequence";
import type { MappedVoiceFormState } from "@/features/voice-intake/lib/map-extraction-to-form";

/** Visual top-to-bottom order on the estimate request form. */
export const VOICE_FORM_APPLY_ORDER: FormFieldPath[] = [
  "title",
  "customer.fullName",
  "customer.email",
  "customer.phone",
  "industryFields.area_size",
  "address.streetAddress",
  "address.city",
  "address.postalCode",
  "address.voivodeship",
  "industryFields.property_type",
  "project.preferredStartDate",
  "project.description",
];

const TYPEWRITER_FIELD_PATHS = new Set<FormFieldPath>([
  "title",
  "customer.fullName",
  "customer.email",
  "customer.phone",
  "address.streetAddress",
  "address.city",
  "address.postalCode",
  "industryFields.area_size",
  "project.description",
]);

export function hasApplicableValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return value;
  return false;
}

export function buildVoiceApplySequence(state: MappedVoiceFormState): FormFieldPath[] {
  return VOICE_FORM_APPLY_ORDER.filter((path) => {
    const value = getValueAtPath(state, path);
    return hasApplicableValue(value);
  });
}

export function usesTypewriterEffect(path: FormFieldPath): boolean {
  return TYPEWRITER_FIELD_PATHS.has(path);
}

export function setValueAtPath(
  working: MappedVoiceFormState,
  path: FormFieldPath,
  value: string | number | boolean | null,
): void {
  switch (path) {
    case "title":
      working.title = String(value ?? "");
      break;
    case "address.streetAddress":
      working.address.streetAddress = String(value ?? "");
      break;
    case "address.city":
      working.address.city = String(value ?? "");
      break;
    case "address.postalCode":
      working.address.postalCode = String(value ?? "");
      break;
    case "address.voivodeship":
      working.address.voivodeship = String(value ?? "");
      break;
    case "customer.fullName":
      working.customer.fullName = String(value ?? "");
      break;
    case "customer.email":
      working.customer.email = String(value ?? "");
      break;
    case "customer.phone":
      working.customer.phone = String(value ?? "");
      break;
    case "project.preferredStartDate":
      working.project.preferredStartDate = String(value ?? "asap");
      break;
    case "project.description":
      working.project.description = String(value ?? "");
      break;
    case "industryFields.property_type":
      working.industryFields.property_type = value as string | number | boolean | null;
      break;
    case "industryFields.area_size":
      working.industryFields.area_size = value as string | number | boolean | null;
      break;
    default:
      break;
  }
}

export function createEmptyWorkingState(
  state: MappedVoiceFormState,
  getIndustryFields: () => MappedVoiceFormState["industryFields"],
): MappedVoiceFormState {
  return {
    title: undefined,
    customer: { fullName: "", email: "", phone: "" },
    address: { streetAddress: "", city: "", postalCode: "", voivodeship: "" },
    project: { preferredStartDate: "asap", description: "" },
    industryFields: { ...getIndustryFields() },
    voiceAppliedValues: state.voiceAppliedValues,
  };
}
