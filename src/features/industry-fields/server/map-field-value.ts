import type { DocumentFieldValue, IndustryFieldValueType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type FieldValueInput = string | number | boolean | Date | null | undefined;

export type TypedFieldValueColumns = {
  valueText: string | null;
  valueNumber: Decimal | null;
  valueDate: Date | null;
  valueBoolean: boolean | null;
};

const EMPTY_COLUMNS: TypedFieldValueColumns = {
  valueText: null,
  valueNumber: null,
  valueDate: null,
  valueBoolean: null,
};

export function mapInputToTypedColumns(
  valueType: IndustryFieldValueType,
  value: FieldValueInput,
): TypedFieldValueColumns {
  if (value === null || value === undefined || value === "") {
    return EMPTY_COLUMNS;
  }

  switch (valueType) {
    case "TEXT":
    case "SELECT":
      return { ...EMPTY_COLUMNS, valueText: String(value) };
    case "NUMBER":
      return { ...EMPTY_COLUMNS, valueNumber: new Decimal(Number(value)) };
    case "DATE":
      return {
        ...EMPTY_COLUMNS,
        valueDate: value instanceof Date ? value : new Date(String(value)),
      };
    case "BOOLEAN":
      return { ...EMPTY_COLUMNS, valueBoolean: Boolean(value) };
    default:
      return EMPTY_COLUMNS;
  }
}

export function readTypedFieldValue(
  row: Pick<DocumentFieldValue, "valueText" | "valueNumber" | "valueDate" | "valueBoolean">,
): string | number | boolean | Date | null {
  if (row.valueText !== null) {
    return row.valueText;
  }

  if (row.valueNumber !== null) {
    return row.valueNumber.toNumber();
  }

  if (row.valueDate !== null) {
    return row.valueDate;
  }

  if (row.valueBoolean !== null) {
    return row.valueBoolean;
  }

  return null;
}
