// What the recording scripts (e2e-walker, record-hero, record-journey) share: the walk's photo and the phone's browser context.

/** An illustration drawn in the page (a demo, not a stock picture of someone's dog), as base64 JPEG. */
export function drawWalkPhoto(page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 960;
    const g = canvas.getContext("2d");
    const sky = g.createLinearGradient(0, 0, 0, 960);
    sky.addColorStop(0, "#9ad0ff");
    sky.addColorStop(1, "#d9f0c8");
    g.fillStyle = sky;
    g.fillRect(0, 0, 1280, 960);
    g.fillStyle = "#4f9d4a";
    g.fillRect(0, 700, 1280, 260);
    g.font = "360px serif";
    g.fillText("🐕", 300, 700);
    g.font = "bold 44px sans-serif";
    g.fillStyle = "#0c3b1f";
    g.fillText("Illustration — Folioviv demo", 330, 860);
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  });
}

/** A dark phone context in the shop's time zone, without the development server's own indicator. */
export async function newPhoneContext(browser, { viewport, scale, locale }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: scale,
    locale: locale === "fr" ? "fr-CA" : "en-CA",
    timezoneId: "America/Toronto",
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("kz-theme", "dark");
    } catch {
      /* none */
    }
    const style = document.createElement("style");
    style.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () => document.head.append(style));
  });
  return context;
}
