import { z } from "zod";

export const COMPANY_ADDRESS_MAX_LENGTH = 300;
export const COMPANY_TAX_ID_MAX_LENGTH = 20;
export const COMPANY_EMAIL_MAX_LENGTH = 254;
export const COMPANY_PHONE_MIN_LENGTH = 6;
export const COMPANY_PHONE_MAX_LENGTH = 40;

const POLISH_TAX_ID_DIGITS = /^\d{10}$/;

function normalizeTaxIdDigits(value: string): string {
  return value.replace(/[\s-]/g, "");
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

const optionalAddressSchema = z
  .string()
  .trim()
  .max(COMPANY_ADDRESS_MAX_LENGTH)
  .optional()
  .nullable()
  .transform(emptyToNull);

const optionalTaxIdSchema = z
  .string()
  .trim()
  .max(COMPANY_TAX_ID_MAX_LENGTH)
  .optional()
  .nullable()
  .transform(emptyToNull)
  .refine(
    (value) => {
      if (value === null) {
        return true;
      }

      return POLISH_TAX_ID_DIGITS.test(normalizeTaxIdDigits(value));
    },
    { message: "INVALID_TAX_ID" },
  )
  .transform((value) => {
    if (value === null) {
      return null;
    }

    return normalizeTaxIdDigits(value);
  });

const optionalEmailSchema = z
  .string()
  .trim()
  .max(COMPANY_EMAIL_MAX_LENGTH)
  .optional()
  .nullable()
  .transform(emptyToNull)
  .refine(
    (value) => {
      if (value === null) {
        return true;
      }

      return z.string().email().safeParse(value).success;
    },
    { message: "INVALID_EMAIL" },
  );

const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform(emptyToNull)
  .refine(
    (value) => {
      if (value === null) {
        return true;
      }

      return (
        value.length >= COMPANY_PHONE_MIN_LENGTH &&
        value.length <= COMPANY_PHONE_MAX_LENGTH
      );
    },
    { message: "INVALID_PHONE" },
  );

export const updateWorkspaceCompanyProfileSchema = z.object({
  companyAddress: optionalAddressSchema,
  companyTaxId: optionalTaxIdSchema,
  companyEmail: optionalEmailSchema,
  companyPhone: optionalPhoneSchema,
});

export type UpdateWorkspaceCompanyProfileInput = z.input<
  typeof updateWorkspaceCompanyProfileSchema
>;

export type ParsedWorkspaceCompanyProfile = z.output<
  typeof updateWorkspaceCompanyProfileSchema
>;

export function parseCompanyProfileFields(
  input: UpdateWorkspaceCompanyProfileInput,
): ParsedWorkspaceCompanyProfile {
  return updateWorkspaceCompanyProfileSchema.parse(input);
}
