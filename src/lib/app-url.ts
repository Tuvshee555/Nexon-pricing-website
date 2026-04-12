export function getAppUrl(request?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}
