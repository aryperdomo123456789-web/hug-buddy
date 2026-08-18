import { createServerFn } from "@tanstack/react-start";

export const getOdinCurrentSession = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  const { getOdinAccessTokenFromCookieHeader, verifyOdinSessionToken } = await import("./auth-session.server");

  const request = getRequest();
  const cookieHeader = request?.headers?.get("cookie");
  const accessToken = await getOdinAccessTokenFromCookieHeader(cookieHeader);

  if (!accessToken) return null;

  return verifyOdinSessionToken(accessToken);
});
