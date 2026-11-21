import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OriginLink, routerLinkable } from "./OriginLink";

describe("routerLinkable (krizaka-internal#4137)", () => {
  it("keeps the router for a page of this origin", () => {
    expect(routerLinkable("/fr/pricing")).toBe(true);
    expect(routerLinkable("/en/app")).toBe(true);
  });

  it("refuses another origin, directly or through the /s/<slug> hop", () => {
    expect(routerLinkable("https://pattes-saint-henri.folioviv.shop/fr")).toBe(false);
    expect(routerLinkable("//pattes-saint-henri.folioviv.shop/fr")).toBe(false);
    expect(routerLinkable("/fr/s/pattes-saint-henri")).toBe(false);
    expect(routerLinkable("/en/s/cedre-ciseaux/service/1")).toBe(false);
  });

  it("refuses every link of a page served on a shop's own origin", () => {
    expect(routerLinkable("/fr/sign-in", true)).toBe(false);
  });
});

describe("OriginLink", () => {
  it("draws the same anchor either way, so the markup does not change", () => {
    expect(renderToStaticMarkup(<OriginLink href="/fr/s/pattes-saint-henri">x</OriginLink>)).toBe(
      '<a href="/fr/s/pattes-saint-henri">x</a>',
    );
    expect(
      renderToStaticMarkup(
        <OriginLink href="/fr/pricing" offOrigin className="c">
          x
        </OriginLink>,
      ),
    ).toBe('<a href="/fr/pricing" class="c">x</a>');
  });
});
