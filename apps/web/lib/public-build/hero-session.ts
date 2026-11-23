/** A static page knows no visitor: never signed in. */
export async function heroSignedIn(): Promise<boolean> {
  return false;
}
