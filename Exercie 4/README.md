# Papertrail Notes

## Run locally

1. Install dependencies with `npm install`.
2. Create a `.env.local` file containing `PAPERTRAIL_SESSION_SECRET` set to a random secret of at least 32 characters. To generate one in PowerShell, run:

   ```powershell
   node -e "require('node:fs').writeFileSync('.env.local', 'PAPERTRAIL_SESSION_SECRET=' + require('node:crypto').randomBytes(32).toString('base64url') + '\n')"
   ```

   `.env.example` shows the expected variable name.
3. Start the app with `npm run dev`.
4. Create an account from the sign-in page.

Accounts are stored locally in `data/accounts.csv`. The file contains salted scrypt password hashes, never plaintext passwords. Notes are stored in browser local storage separately for each account on that device. Notes can be edited, moved to Trash and restored; duplicate titles and duplicate non-empty note text are checked without regard to capitalization or extra whitespace.

This file-backed account store is intended only for a local learning demo. Sign-in displays separate messages for unknown email addresses and incorrect passwords, which can reveal whether an email is registered; do not deploy this account-enumerating behavior for a public service. The demo also has no password recovery, email ownership verification, rate limiting, database backup, or multi-server storage. Do not use a real Gmail password or reuse a password from another service.
