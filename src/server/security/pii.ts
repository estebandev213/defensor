const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phonePattern = /(?<!\d)(?:\+?51[\s-]?)?9\d{8}(?!\d)/g;
const dniPattern = /(?<!\d)\d{8}(?!\d)/g;

export function redactPii(value: string): string {
  return value
    .replace(emailPattern, "[EMAIL_REDACTED]")
    .replace(phonePattern, "[PHONE_REDACTED]")
    .replace(dniPattern, "[DNI_REDACTED]");
}

