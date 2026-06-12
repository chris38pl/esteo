import {
  ANIMATED_FIELD_KEYS,
  INSTANT_FIELD_KEYS,
  type MappedVoiceFormState,
} from "@/features/voice-intake/lib/map-extraction-to-form";

export type FormFieldPath = (typeof ANIMATED_FIELD_KEYS)[number] | (typeof INSTANT_FIELD_KEYS)[number];

export function getValueAtPath(state: MappedVoiceFormState, path: FormFieldPath): unknown {
  switch (path) {
    case "title":
      return state.title ?? "";
    case "address.streetAddress":
      return state.address.streetAddress;
    case "address.city":
      return state.address.city;
    case "address.postalCode":
      return state.address.postalCode;
    case "address.voivodeship":
      return state.address.voivodeship;
    case "customer.fullName":
      return state.customer.fullName;
    case "customer.email":
      return state.customer.email;
    case "customer.phone":
      return state.customer.phone;
    case "project.preferredStartDate":
      return state.project.preferredStartDate;
    case "project.description":
      return state.project.description;
    case "industryFields.property_type":
      return state.industryFields.property_type ?? null;
    case "industryFields.area_size":
      return state.industryFields.area_size ?? null;
    default:
      return null;
  }
}

export const ANIMATION_FIELD_SEQUENCE = [...ANIMATED_FIELD_KEYS];
export const INSTANT_FIELD_SEQUENCE = [...INSTANT_FIELD_KEYS];
