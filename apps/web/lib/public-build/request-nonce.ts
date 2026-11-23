/** A static export has no request and no policy per response: no nonce. */
export async function requestNonce(): Promise<string | undefined> {
  return undefined;
}
