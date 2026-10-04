import { ReplitConnectors } from "@replit/connectors-sdk";

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let phone = value.replace(/[\s()-]/g, "");
  if (/^0\d{10}$/.test(phone)) phone = `+234${phone.slice(1)}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

// Discover only an existing sender: never purchase numbers or change Twilio settings.
export async function sendSms(to: string, body: string): Promise<void> {
  const connectors = new ReplitConnectors();
  const accountsResponse = await connectors.proxy("twilio", "/2010-04-01/Accounts.json?PageSize=1", { method: "GET" });
  if (!accountsResponse.ok) throw new Error("Twilio account lookup failed");
  const accounts = await accountsResponse.json() as any;
  const accountSid = accounts.accounts?.[0]?.sid;
  if (!accountSid) throw new Error("No Twilio account is available");
  const numbersResponse = await connectors.proxy("twilio", `/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PageSize=100`, { method: "GET" });
  if (!numbersResponse.ok) throw new Error("Twilio sender lookup failed");
  const numbers = await numbersResponse.json() as any;
  const sender = numbers.incoming_phone_numbers?.find((number: any) => number.capabilities?.sms)?.phone_number;
  if (!sender) throw new Error("Twilio needs an existing SMS-capable sending number");
  const response = await connectors.proxy("twilio", `/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: sender, Body: body }).toString(),
  });
  if (!response.ok) throw new Error(`Twilio did not accept the message (HTTP ${response.status})`);
}