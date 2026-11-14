// Signs the Android release build with the upload key named by the environment, never one in the repository:
//   KRIZAKA_ANDROID_KEYSTORE (path), KRIZAKA_ANDROID_KEYSTORE_PASSWORD, KRIZAKA_ANDROID_KEY_ALIAS, KRIZAKA_ANDROID_KEY_PASSWORD.
// Without them the release build keeps the debug key (a local test build), as Expo's template does.
const { withAppBuildGradle } = require("expo/config-plugins");

const RELEASE_CONFIG = `        release {
            if (System.getenv("KRIZAKA_ANDROID_KEYSTORE")) {
                storeFile file(System.getenv("KRIZAKA_ANDROID_KEYSTORE"))
                storePassword System.getenv("KRIZAKA_ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("KRIZAKA_ANDROID_KEY_ALIAS")
                keyPassword System.getenv("KRIZAKA_ANDROID_KEY_PASSWORD")
            }
        }
`;

const DEBUG_USE = "signingConfig signingConfigs.debug";

/** Adds the `release` signing config and makes the release build type use it when the environment names a key. Idempotent. */
function addReleaseSigning(gradle) {
  if (gradle.includes("KRIZAKA_ANDROID_KEYSTORE")) return gradle;
  const withConfig = gradle.replace(
    /(signingConfigs \{\n(?:.*\n)*?\x20{8}debug \{(?:.*\n)*?\x20{8}\}\n)/,
    `$1${RELEASE_CONFIG}`,
  );
  if (withConfig === gradle) throw new Error("with-release-signing: the signingConfigs block of the template changed");
  const buildTypes = withConfig.indexOf("buildTypes {\n");
  const release = buildTypes < 0 ? -1 : withConfig.indexOf("\n        release {\n", buildTypes);
  const debugUse = release < 0 ? -1 : withConfig.indexOf(DEBUG_USE, release);
  if (debugUse < 0) throw new Error("with-release-signing: the release build type of the template changed");
  return (
    withConfig.slice(0, debugUse) +
    `signingConfig System.getenv("KRIZAKA_ANDROID_KEYSTORE") ? signingConfigs.release : signingConfigs.debug` +
    withConfig.slice(debugUse + DEBUG_USE.length)
  );
}

module.exports = (config) =>
  withAppBuildGradle(config, (c) => {
    c.modResults.contents = addReleaseSigning(c.modResults.contents);
    return c;
  });
module.exports.addReleaseSigning = addReleaseSigning;
