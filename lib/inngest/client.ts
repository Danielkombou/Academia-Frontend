import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "veni",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  baseUrl: process.env.INNGEST_BASE_URL,
  isDev: process.env.INNGEST_DEV === "1",
});

export async function getInngestClient() {
  return inngest;
}