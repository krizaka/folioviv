/** Runs a script's `main` when the file is the entry point; a failure prints `<name>: <message>` and exits 1. */
export async function runMain(metaUrl, name, main) {
  if (metaUrl !== `file://${process.argv[1]}`) {
    return;
  }
  try {
    await main();
  } catch (error) {
    console.error(`${name}: ${error.message}`);
    process.exit(1);
  }
}
