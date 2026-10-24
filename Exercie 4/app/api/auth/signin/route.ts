import { NextResponse } from "next/server";
import {
  assertSessionConfiguration,
  checkSignInCredentials,
  createSession
} from "../../../../lib/auth";
import { readCredentials } from "../../../../lib/credentials";

export async function POST(request: Request) {
  const credentials = await readCredentials(request);
  if (!credentials) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  try {
    assertSessionConfiguration();
    const email = credentials.email.trim().toLowerCase();
    const credentialStatus = await checkSignInCredentials(email, credentials.password);

    if (credentialStatus === "invalid-email") {
      return NextResponse.json({ error: "Incorrect email address." }, { status: 400 });
    }
    if (credentialStatus === "email-not-found") {
      return NextResponse.json({ error: "Email does not exist." }, { status: 404 });
    }
    if (credentialStatus === "incorrect-password") {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    await createSession(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Sign-in failed.", error);
    return NextResponse.json(
      { error: "Unable to sign in. Please try again." },
      { status: 500 }
    );
  }
}
