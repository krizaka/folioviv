import { pageSession } from "@/lib/access";

/** Whether the visitor has a session, for the home's hero (read on the server; a failed read is « no »). */
export async function heroSignedIn(): Promise<boolean> {
  return Boolean(await pageSession().catch(() => null));
}
