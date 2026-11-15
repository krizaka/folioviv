// The guard of the seed (krizaka-internal#3827): after seeding, every QA persona of the cast signs in, or the seed fails with the persona's name.
// A persona is a person the testers and the recorders sign in as (ERIC, CAMILLE, MIRA, WALKER); its address and password come from the
// environment (`QA_*`, from the `APP_QA_FOLIOVIV_*` secrets), so a seed that makes the account elsewhere is caught here, not by a tester.
// Nothing sensitive is printed: the persona's name and the reason only, never the address or the password.
import { verifyPassword } from "@krizaka/auth";

/** The persona the guard names, and the variables that hold its sign-in (`QA_<X>_EMAIL`, `QA_<X>_PASSWORD`). */
export const QA_PERSONAS = [
  { name: "ERIC", email: "QA_USER_EMAIL", password: "QA_USER_PASSWORD" },
  { name: "CAMILLE", email: "QA_STAFF_EMAIL", password: "QA_STAFF_PASSWORD", optional: true },
  { name: "MIRA", email: "QA_ADMIN_EMAIL", password: "QA_ADMIN_PASSWORD" },
  { name: "WALKER", email: "QA_WALKER_EMAIL", password: "QA_WALKER_PASSWORD" },
];

/** Why one persona cannot sign in with this address and password (`no account`, `account disabled`, `password`), or undefined when it can. */
async function reasonItCannot(findAccount, email, password) {
  const account = await findAccount(email);
  if (!account) {
    return "no account at its address";
  }
  if (account.status !== "ACTIVE") {
    return "account disabled";
  }
  if (!account.passwordHash || !(await verifyPassword(password, account.passwordHash))) {
    return "the password does not match";
  }
  return undefined;
}

/**
 * The sign-in of each persona the environment gives: why it cannot, or nothing. `findAccount(email)` returns `{ status, passwordHash }` or
 * undefined. A persona with no address in the environment fails, unless it is optional (CAMILLE, the staff member, needs a shop's team).
 */
export async function qaSignInProblems(env, findAccount, defaults = {}) {
  const problems = [];
  for (const p of QA_PERSONAS) {
    const email = (env[p.email] ?? env[`APP_${p.email}`] ?? defaults[p.name]?.email ?? "").trim().toLowerCase();
    const password = env[p.password] ?? env[`APP_${p.password}`] ?? defaults[p.name]?.password ?? "";
    let reason = "no address or password given to the seed";
    if (email && password) {
      reason = await reasonItCannot(findAccount, email, password);
    } else if (p.optional) {
      reason = undefined;
    }
    if (reason) {
      problems.push({ name: p.name, reason });
    }
  }
  return problems;
}

/** Throws naming every persona that cannot sign in. */
export async function assertQaPersonasSignIn(env, findAccount, defaults) {
  const problems = await qaSignInProblems(env, findAccount, defaults);
  if (problems.length > 0) {
    const named = problems.map((p) => p.name + " (" + p.reason + ")").join(", ");
    throw new Error("QA persona(s) that cannot sign in: " + named + " — the seed must make them");
  }
}
