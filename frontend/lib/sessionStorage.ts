const ACCOUNT_LOCAL_PREFIXES = ["careeros-", "careernaviq-"];

function isAccountLocalKey(key: string) {
  return ACCOUNT_LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function clearAccountLocalState() {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && isAccountLocalKey(key)) keysToRemove.push(key);
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

export function startAuthenticatedSession(accessToken: string) {
  if (typeof window === "undefined") return;
  clearAccountLocalState();
  window.localStorage.setItem("token", accessToken);
}

export function endAuthenticatedSession() {
  if (typeof window === "undefined") return;
  clearAccountLocalState();
  window.localStorage.removeItem("token");
}
