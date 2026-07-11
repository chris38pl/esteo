/** Short, user-facing message for Resend / transport failures. */
export function formatEstimateSendErrorMessage(raw: string | null | undefined): string {
  if (!raw?.trim()) {
    return "";
  }

  const message = raw.trim();

  if (message.includes("domain is not verified")) {
    return "Nie można wysłać e-maila - domena nadawcy nie jest zweryfikowana w Resend. Użyj onboarding@resend.dev (dev) lub zweryfikuj własną domenę.";
  }

  if (message.includes("only send testing emails to your own email address")) {
    const match = message.match(/your own email address \(([^)]+)\)/i);
    const ownerEmail = match?.[1];
    return ownerEmail
      ? `W trybie testowym Resend wysyła tylko na ${ownerEmail}. Ustaw EMAIL_DEV_REDIRECT_TO na ten adres albo zweryfikuj domenę.`
      : "W trybie testowym Resend wysyła tylko na adres właściciela konta. Ustaw EMAIL_DEV_REDIRECT_TO lub zweryfikuj domenę.";
  }

  if (message.length > 200) {
    return `${message.slice(0, 197)}…`;
  }

  return message;
}
