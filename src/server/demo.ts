export function getDemoEmail() {
  return process.env.DEMO_EMAIL ?? process.env.NEXT_PUBLIC_DEMO_EMAIL;
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  return origin !== null && origin === new URL(request.url).origin;
}
