import type { VoiceIntakeFieldDefinitionSummary } from "@/ai/prompts/voice-intake-extraction";
import type { IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
export function buildFieldDefinitionsForVoice(
  fields: IndustryFieldForDocument[],
): VoiceIntakeFieldDefinitionSummary[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    valueType: field.valueType,
    required: field.required,
    options: field.options?.map((option) => ({
      value: option.value,
      label: option.labelKey ?? option.value,
    })),
  }));
}
