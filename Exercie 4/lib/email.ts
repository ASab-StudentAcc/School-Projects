export function isValidGmailAddress(value: string): boolean {
  const email = value.trim().toLowerCase();

  if (email.length > 254 || !/^[^@]+@gmail\.com$/.test(email)) {
    return false;
  }

  const localPart = email.slice(0, email.lastIndexOf("@"));
  const [username, ...aliases] = localPart.split("+");

  return (
    username.length >= 6 &&
    username.length <= 30 &&
    /^[a-z0-9]+(?:\.[a-z0-9]+)*$/.test(username) &&
    aliases.length <= 1 &&
    (aliases.length === 0 || /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(aliases[0]))
  );
}
