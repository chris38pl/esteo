import type { Locale } from "@/lib/locale";

export type IntegrationErrorCode =
  | "INVALID_API_KEY"
  | "FORBIDDEN_PLAN"
  | "FORBIDDEN_SCOPE"
  | "FORBIDDEN_ORIGIN"
  | "FORBIDDEN_IP"
  | "VALIDATION_ERROR"
  | "ATTACHMENT_LIMIT_EXCEEDED"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "ATTACHMENT_UPLOAD_FAILED"
  | "IDEMPOTENCY_CONFLICT"
  | "RATE_LIMITED"
  | "NOT_IMPLEMENTED"
  | "INTERNAL_ERROR"
  | "STORAGE_FULL"
  | "UNAVAILABLE";

type ErrorCopy = { message: string; suggestion: string };

const ERRORS: Record<IntegrationErrorCode, Record<Locale, ErrorCopy>> = {
  INVALID_API_KEY: {
    pl: {
      message: "Nieprawidłowy lub unieważniony klucz API.",
      suggestion: "Sprawdź klucz w ustawieniach Integrations albo wygeneruj nowy.",
    },
    en: {
      message: "Invalid or revoked API key.",
      suggestion: "Check the key in Integrations settings or regenerate it.",
    },
  },
  FORBIDDEN_PLAN: {
    pl: {
      message: "Integrations jest dostępne tylko w planie Business.",
      suggestion: "Uaktualnij workspace do planu Business, aby używać Public API.",
    },
    en: {
      message: "Integrations is available on the Business plan only.",
      suggestion: "Upgrade the workspace to Business to use the Public API.",
    },
  },
  FORBIDDEN_SCOPE: {
    pl: {
      message: "Ten klucz nie ma wymaganych uprawnień.",
      suggestion: "Użyj klucza ze scope requests:write albo utwórz nowy klucz.",
    },
    en: {
      message: "This API key is missing the required scope.",
      suggestion: "Use a key with the requests:write scope or create a new key.",
    },
  },
  FORBIDDEN_ORIGIN: {
    pl: {
      message: "Origin żądania nie jest na liście dozwolonych.",
      suggestion: "Dodaj origin przeglądarki do Allowed origins albo wywołaj API z serwera.",
    },
    en: {
      message: "Request origin is not in the allowlist.",
      suggestion: "Add the browser origin to Allowed origins or call the API from a server.",
    },
  },
  FORBIDDEN_IP: {
    pl: {
      message: "Adres IP nie jest na liście dozwolonych.",
      suggestion: "Dodaj IP klienta do Allowed IPs albo wyczyść listę IP.",
    },
    en: {
      message: "Client IP is not in the allowlist.",
      suggestion: "Add the client IP to Allowed IPs or clear the IP allowlist.",
    },
  },
  VALIDATION_ERROR: {
    pl: {
      message: "Payload nie przeszedł walidacji.",
      suggestion: "Porównaj body z GET /api/v1/public/schema i popraw brakujące pola.",
    },
    en: {
      message: "Payload validation failed.",
      suggestion: "Compare the body with GET /api/v1/public/schema and fix missing fields.",
    },
  },
  ATTACHMENT_LIMIT_EXCEEDED: {
    pl: {
      message: "Przekroczono limit załączników.",
      suggestion: "Usuń część plików lub skompresuj je przed ponowną próbą.",
    },
    en: {
      message: "Attachment limit exceeded.",
      suggestion: "Remove some attachments or compress them before retrying.",
    },
  },
  UNSUPPORTED_MEDIA_TYPE: {
    pl: {
      message: "Jeden lub więcej plików ma nieobsługiwany typ MIME.",
      suggestion: "Użyj typów z limits.allowedMimeTypes w GET /schema.",
    },
    en: {
      message: "One or more files have an unsupported MIME type.",
      suggestion: "Use types listed in limits.allowedMimeTypes from GET /schema.",
    },
  },
  ATTACHMENT_UPLOAD_FAILED: {
    pl: {
      message: "Nie udało się zapisać załączników.",
      suggestion: "Spróbuj ponownie. Jeśli problem się powtarza, zmniejsz rozmiar plików.",
    },
    en: {
      message: "Failed to store attachments.",
      suggestion: "Retry the request. If it persists, reduce file sizes.",
    },
  },
  IDEMPOTENCY_CONFLICT: {
    pl: {
      message: "Ten Idempotency-Key był już użyty z innym body.",
      suggestion: "Użyj nowego Idempotency-Key albo wyślij identyczny request.",
    },
    en: {
      message: "This Idempotency-Key was already used with a different body.",
      suggestion: "Use a new Idempotency-Key or resend the identical request.",
    },
  },
  RATE_LIMITED: {
    pl: {
      message: "Przekroczono limit zapytań dla tego klucza API.",
      suggestion: "Poczekaj i spróbuj ponownie albo zwiększ limity klucza.",
    },
    en: {
      message: "Rate limit exceeded for this API key.",
      suggestion: "Wait and retry, or increase the key rate limits.",
    },
  },
  NOT_IMPLEMENTED: {
    pl: {
      message: "Ten endpoint nie jest jeszcze dostępny w v1.",
      suggestion: "Użyj POST /api/v1/public/requests lub GET /api/v1/public/schema.",
    },
    en: {
      message: "This endpoint is not available in v1 yet.",
      suggestion: "Use POST /api/v1/public/requests or GET /api/v1/public/schema.",
    },
  },
  INTERNAL_ERROR: {
    pl: {
      message: "Wystąpił nieoczekiwany błąd serwera.",
      suggestion: "Przekaż X-Request-Id do supportu Esteo.",
    },
    en: {
      message: "An unexpected server error occurred.",
      suggestion: "Share the X-Request-Id with Esteo support.",
    },
  },
  STORAGE_FULL: {
    pl: {
      message: "Brak miejsca na załączniki w workspace.",
      suggestion: "Zwolnij storage albo dokup pakiet przestrzeni.",
    },
    en: {
      message: "Workspace attachment storage is full.",
      suggestion: "Free up storage or purchase additional capacity.",
    },
  },
  UNAVAILABLE: {
    pl: {
      message: "Workspace jest niedostępny.",
      suggestion: "Sprawdź status subskrypcji i spróbuj ponownie.",
    },
    en: {
      message: "Workspace is unavailable.",
      suggestion: "Check the subscription status and retry.",
    },
  },
};

export function getIntegrationErrorCopy(
  code: IntegrationErrorCode,
  locale: Locale,
): ErrorCopy {
  return ERRORS[code][locale] ?? ERRORS[code].pl;
}
