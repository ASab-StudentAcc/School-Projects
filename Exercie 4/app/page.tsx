"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidGmailAddress } from "../lib/email";

type AccountMode = "signin" | "signup";

const minimumPasswordLength = 12;
const maximumPasswordLength = 128;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AccountMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidGmailAddress(normalizedEmail)) {
      setError("Incorrect email address. Enter a valid Gmail address.");
      return;
    }

    if (password.length < minimumPasswordLength || password.length > maximumPasswordLength) {
      setError(`Use a password with ${minimumPasswordLength}–${maximumPasswordLength} characters.`);
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password })
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to sign in. Please try again.");
        return;
      }

      router.push("/notes");
      router.refresh();
    } catch (requestError) {
      console.error("Unable to reach the sign-in service.", requestError);
      setError("Unable to reach the sign-in service. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeMode(nextMode: AccountMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">p.</div>
        <p className="eyebrow">PAPERTRAIL ACCOUNT</p>
        <h1 id="login-title">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="login-description">
          {mode === "signin"
            ? "Sign in to open your personal notebook."
            : "Create an account to start your personal notebook."}
        </p>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">Gmail address</label>
          <input
            autoComplete="email"
            aria-describedby={`${error ? "form-message " : ""}email-hint`}
            aria-invalid={Boolean(error)}
            id="email"
            maxLength={254}
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="you@gmail.com"
            required
            type="email"
            value={email}
          />
          <p className="field-hint" id="email-hint">
            Use a Gmail address, such as name@gmail.com.
          </p>

          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              aria-describedby={`${error ? "form-message " : ""}password-hint`}
              aria-invalid={Boolean(error)}
              id="password"
              maxLength={maximumPasswordLength}
              minLength={minimumPasswordLength}
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder={`At least ${minimumPasswordLength} characters`}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="password-visibility"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="field-hint" id="password-hint">
            Passwords must be {minimumPasswordLength}–{maximumPasswordLength} characters.
          </p>

          {mode === "signup" && (
            <>
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                autoComplete="new-password"
                aria-describedby={error ? "form-message" : undefined}
                aria-invalid={Boolean(error)}
                id="confirm-password"
                maxLength={maximumPasswordLength}
                minLength={minimumPasswordLength}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter your password again"
                required
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
              />
              <p className="field-hint" />
            </>
          )}

          <button className="primary-button login-button" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>
          <p
            className={`form-message${error ? " is-visible" : ""}`}
            id="form-message"
            role="alert"
            aria-live="polite"
          >
            {error || "\u00a0"}
          </p>
        </form>

        <div className="account-switch">
          {mode === "signin" ? (
            <>
              <span>New to Papertrail?</span>
              <button onClick={() => changeMode("signup")} type="button">Create an account</button>
            </>
          ) : (
            <>
              <span>Already have an account?</span>
              <button onClick={() => changeMode("signin")} type="button">Sign in</button>
            </>
          )}
        </div>

        <p className="login-footnote">
          <span aria-hidden="true">ⓘ</span> Local demo only. Gmail ownership is not verified; don’t reuse a password from another service.
        </p>
      </section>
      <p className="page-caption">Make room for what matters.</p>
    </main>
  );
}
