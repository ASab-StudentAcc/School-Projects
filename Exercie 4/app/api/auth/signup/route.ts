import { NextResponse } from "next/server";
import {
  assertSessionConfiguration,
  AuthInputError,
  createSession,
  registerAccount
} from "../../../../lib/auth";
import { readCredentials } from "../../../../lib/credentials";

export async function POST(request: Request) {
  const credentials = await readCredentials(request);
  if (!credentials) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  try {
    assertSessionConfiguration();
    await registerAccount(credentials.email, credentials.password);
    await createSession(credentials.email.trim().toLowerCase());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Account registration failed.", error);
    return NextResponse.json(
      { error: "Unable to create the account. Please try again." },
      { status: 500 }
    );
  }
}
