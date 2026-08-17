// Genereaza un token stabil pe baza AUTH_SECRET, ca sa nu tinem parola in clar in cookie.
// Foloseste Web Crypto API (nu Node "crypto") ca sa functioneze si in Edge middleware.
export async function getExpectedToken() {
  const secret = process.env.AUTH_SECRET || "fallback-secret";
  const data = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const AUTH_COOKIE_NAME = "maliarca_auth";
