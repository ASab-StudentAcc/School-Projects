import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from "node:crypto";
import { constants } from "node:fs";
import { access, appendFile, mkdir, open, readFile, unlink } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { cookies } from "next/headers";
import { isValidGmailAddress } from "./email";

const cookieName = "papertrail_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;
const passwordKeyLength = 64;
const csvHeader = "email,salt,password_hash\n";
const dataDirectory = path.join(process.cwd(), "data");
const accountsPath = path.join(dataDirectory, "accounts.csv");
const lockPath = path.join(dataDirectory, "accounts.csv.lock");

type Account = {
  email: string;
  salt: string;
  passwordHash: string;
};

export class AuthInputError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 409
  ) {
    super(message);
    this.name = "AuthInputError";
  }
}

function getSessionSecret(): string {
  const secret = process.env.PAPERTRAIL_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("PAPERTRAIL_SESSION_SECRET must be set to at least 32 characters.");
  }
  return secret;
}

export function assertSessionConfiguration(): void {
  getSessionSecret();
}

function derivePasswordHash(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, passwordKeyLength, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
}

async function withAccountsLock<T>(operation: () => Promise<T>): Promise<T> {
  await mkdir(dataDirectory, { recursive: true });
  const deadline = Date.now() + 5000;
  let lockHandle: FileHandle | undefined;

  while (!lockHandle) {
    try {
      lockHandle = await open(lockPath, "wx");
    } catch (error) {
      const isAlreadyLocked =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "EEXIST";
      if (!isAlreadyLocked) throw error;
      if (Date.now() >= deadline) {
        throw new Error("Timed out waiting for the account file lock.");
      }
      await delay(50);
    }
  }

  try {
    return await operation();
  } finally {
    await lockHandle.close();
    await unlink(lockPath);
  }
}

async function ensureAccountsFile(): Promise<void> {
  try {
    await access(accountsPath, constants.F_OK);
  } catch (error) {
    const isMissing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT";
    if (!isMissing) throw error;

    try {
      await open(accountsPath, "wx", 0o600).then(async (file) => {
        try {
          await file.writeFile(csvHeader, "utf8");
        } finally {
          await file.close();
        }
      });
    } catch (createError) {
      const wasCreatedByAnotherProcess =
        typeof createError === "object" &&
        createError !== null &&
        "code" in createError &&
        createError.code === "EEXIST";
      if (!wasCreatedByAnotherProcess) throw createError;
    }
  }
}

async function readAccounts(): Promise<Account[]> {
  try {
    const content = await readFile(accountsPath, "utf8");
    const [header, ...lines] = content.split(/\r?\n/);
    if (header !== csvHeader.trimEnd()) {
      throw new Error("The account CSV file has an invalid header.");
    }

    return lines.filter(Boolean).map((line) => {
      const fields = line.split(",");
      if (
        fields.length !== 3 ||
        !isValidGmailAddress(fields[0]) ||
        !/^[a-f0-9]{64}$/.test(fields[1]) ||
        !/^[a-f0-9]{128}$/.test(fields[2])
      ) {
        throw new Error("The account CSV file contains an invalid record.");
      }
      return { email: fields[0], salt: fields[1], passwordHash: fields[2] };
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

async function findAccount(email: string): Promise<Account | undefined> {
  const accounts = await readAccounts();
  return accounts.find((account) => account.email === email);
}

export async function registerAccount(email: string, password: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidGmailAddress(normalizedEmail)) {
    throw new AuthInputError("Enter a valid Gmail address.", 400);
  }
  if (password.length < 12 || password.length > 128) {
    throw new AuthInputError("Use a password with 12–128 characters.", 400);
  }

  await withAccountsLock(async () => {
    await ensureAccountsFile();
    const existingAccount = await findAccount(normalizedEmail);
    if (existingAccount) {
      throw new AuthInputError("An account with this email already exists. Please sign in instead.", 409);
    }

    const salt = randomBytes(32);
    const passwordHash = await derivePasswordHash(password, salt);
    await appendFile(
      accountsPath,
      `${normalizedEmail},${salt.toString("hex")},${passwordHash.toString("hex")}\n`,
      { encoding: "utf8", mode: 0o600 }
    );
  });
}

export async function verifyAccount(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (password.length > 128) {
    return false;
  }

  const account = await findAccount(normalizedEmail);
  if (!account) return false;

  const salt = Buffer.from(account.salt, "hex");
  const actualHash = await derivePasswordHash(password, salt);
  const expectedHash = Buffer.from(account.passwordHash, "hex");
  return timingSafeEqual(actualHash, expectedHash);
}

export async function checkSignInCredentials(
  email: string,
  password: string
): Promise<"invalid-email" | "email-not-found" | "incorrect-password" | "valid"> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidGmailAddress(normalizedEmail)) {
    return "invalid-email";
  }

  const account = await findAccount(normalizedEmail);
  if (!account) {
    return "email-not-found";
  }

  if (!(await verifyAccount(normalizedEmail, password))) {
    return "incorrect-password";
  }

  return "valid";
}

export async function createSession(email: string): Promise<void> {
  const expiresAt = Date.now() + sessionDurationSeconds * 1000;
  const payload = Buffer.from(JSON.stringify({ email, expiresAt })).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  const cookieStore = await cookies();

  cookieStore.set(cookieName, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDurationSeconds
  });
}

export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest();
  let providedSignature: Buffer;
  try {
    providedSignature = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof session !== "object" ||
      session === null ||
      !("email" in session) ||
      !("expiresAt" in session) ||
      typeof session.email !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now() ||
      !isValidGmailAddress(session.email)
    ) {
      return null;
    }
    return session.email;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
