// The demo owner of the journeys (Léa, « Pattes de Saint-Henri »). Her address is the one the QA secret names (krizaka-internal#3827): the journeys' setup
// seeds the cast with it (`QA_WALKER_EMAIL`, scripts/ci-journeys-start.sh), so the journey signs in exactly as a tester does on dev.
export const DEMO_OWNER_EMAIL = process.env.E2E_EMAIL ?? "lea.beaulieu@akinaza.test";
export const DEMO_OWNER_PASSWORD = process.env.E2E_PASSWORD ?? "local-cast-password-0123";
