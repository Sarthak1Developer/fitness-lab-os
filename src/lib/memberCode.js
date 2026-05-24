export function generateMemberCode() {
  // Short, copy-friendly code with enough entropy.
  // Example: MBR-7K3P9Q2D
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I

  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }

  return `MBR-${out}`;
}

export function normalizePhoneE164(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return "";

  // Allow users to type spaces/dashes, but require E.164 overall.
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) return "";

  // E.164: + followed by 8-15 digits, first digit non-zero
  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) return "";

  return cleaned;
}

export function normalizeFullName(name) {
  return String(name || "")
    .replace(/\s+/g, " ")
    .trim();
}
