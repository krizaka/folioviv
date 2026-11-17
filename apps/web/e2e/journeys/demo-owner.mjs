// The demo owner of the journeys (Léa, « Pattes de Saint-Henri »). Her address is the one the QA secret names (krizaka-internal#3827): the journeys' setup
// seeds the cast with it (`QA_WALKER_EMAIL`, scripts/ci-journeys-start.sh), so the journey signs in exactly as a tester does on dev.
export const DEMO_OWNER_EMAIL = process.env.E2E_EMAIL ?? "lea.beaulieu@akinaza.test";
export const DEMO_OWNER_PASSWORD = process.env.E2E_PASSWORD ?? "local-cast-password-0123";

/** Submits the sign-in form as the demo owner (the caller waits for the page it expects). */
export async function submitDemoOwnerSignIn(page) {
  await page.goto("/fr/sign-in");
  await page.locator("input[type=email]").first().fill(DEMO_OWNER_EMAIL);
  await page.locator("input[type=password]").first().fill(DEMO_OWNER_PASSWORD);
  await page.locator("form button[type=submit]").first().click();
}

/** Signs the demo owner in and returns the base path of her shop's app (`/fr/app/<shop>`). */
export async function signInAsDemoOwner(page) {
  await submitDemoOwnerSignIn(page);
  // `/app` alone redirects to the shop's own address: wait for that one.
  await page.waitForURL(/\/fr\/app\/[^/?]+/, { timeout: 60_000 });
  return new URL(page.url()).pathname.match(/^\/fr\/app\/[^/]+/)?.[0];
}
