export type Credentials = {
  email: string;
  password: string;
};

export async function readCredentials(request: Request): Promise<Credentials | null> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) return null;

  try {
    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      !("password" in body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      body.email.length > 254 ||
      body.password.length > 128
    ) {
      return null;
    }
    return { email: body.email, password: body.password };
  } catch {
    return null;
  }
}
