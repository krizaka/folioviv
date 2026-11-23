# Public site brief: www.folioviv.com (the public export)

krizaka-internal#4636 (parent #4630, report lines P3, P3b, P4, H5, H6 and the video register § 5). Ten short sections, the
company's strategy template. Every fact below is read from the product's code, catalogues or tests; a line that waits for a
decision says so.

## 1. Context

The public export (krizaka-internal#4626) holds the home, the owner's guide (a hub and five pages) and the privacy page, in
French and English. The product is in development: no sign-up, no pricing page, no demo shop and no sign-in in the export.
The founder read the pages as a proof of concept: a slogan and some cards, without a clear « what it does and does not do ».

## 2. Objective

A visitor understands in five seconds what Folioviv does (bookings, invoices with GST and QST, a tax report) and what it does
not do (it files nothing, it is no point of sale, it is not for food service, it is not open for sign-up), and sees the real
product, not a mock-up.

## 3. Audience

Independent service shops in Québec: salons, studios, dog walkers, the self-employed who bill by the hour. One owner, sometimes
a small team, French first, English equal. Restaurants, cafés, bars and bakeries with on-site consumption are out (the
database refuses them).

## 4. Jobs the page answers

1. When clients book by phone or message, I want them to pick a free time on my page, so no one is booked twice.
2. When I bill, I want GST and QST on the invoice without working them out, so my invoices are right the first time.
3. When the quarter ends, I want the three figures of the return ready with their invoices, so I file it myself without a
   shoebox of receipts.

## 5. Positioning

For an independent Québec service shop, Folioviv keeps bookings, invoices and the quarter's tax figures in one place, in French
and English. It prepares; the merchant files. Unlike a generic booking app, the taxes are part of the invoice; unlike an
accounting suite, it stops at the figures the owner reads.

## 6. Messages and their proof

| Message                                                                  | Proof (what runs)                                                                                                            |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| A taken time disappears at once                                          | the booking guide (`messages/*.json`, `docs.pages.bookings`): « seules les heures vraiment libres sont montrées »            |
| GST 5 % and QST 9.975 %, worked out once on the subtotal, in whole cents | `packages/core/src/tax.test.ts`: « GST 5 % and QST 9.975 % on known invoices », « taxes the invoice once, not line by line » |
| You file the return yourself                                             | AGENTS.md (Folioviv prepares, the merchant files) and the test that scans the e-mails for a filing promise                   |
| The cards are examples                                                   | `data-demo` and the visible « Exemple » label; the export guard reads them as samples (krizaka-internal#4678)                |

« Au cent près » (H6) is replaced by what the test proves: calculated once on the subtotal, in whole cents.

## 7. What Folioviv does not do (said on the home)

It files and transmits no return. It takes no payment at the counter (the point of sale is a stub). It is not for food service.
It is not open for sign-up while in development.

## 8. Voice and words

Vouvoiement, sober, no superlative, no date, no compliance or exactness promise beyond a test, no technical or product name
typed in a component (the catalogues carry `{product}`), never « open source » (the licence is FSL-1.1-ALv2: « code public »),
no AI word. Words removed: « réglés » (reads as « paid », H5), « au cent près » (H6), the date in the hero caption,
« Krizaka UI » in a clip caption.

## 9. Media, by role

Read from `apps/web/content/media-registry.json` (role → recording of `content/app-videos.json`, recorded by our tests on demo
data, on the media CDN). Adding an entry shows it with no code change (`lib/section-media.test.ts`).

| Page · role                    | Media                                          | Why                                                                  |
| ------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------- |
| home · hero                    | the one-take product recording (`lib/tour.ts`) | the real app on a phone, demo shop                                   |
| home · storefront              | `web-storefront`                               | what a client sees before booking                                    |
| docs · lead, docs/books · lead | `android-today-books`                          | the day and the books the owner reads before filing                  |
| docs/shop · lead               | `web-composer`                                 | the owner arranges the page; nothing is published until they publish |

Requests (not made here): the brand library's beaver shots (receipts, the night desk) are not on the media CDN; a page that
shows one needs its upload and the founder's yes. A Runway visual only with the founder's yes. No voice-over. The « home »
clip with the « Tu rentres à l'heure » title is not on this site (krizaka.com, report S3).

## 10. Measure and decisions

Done when: the export guard is at 0; each page says what Folioviv does and does not do, FR and EN; the footer is data
(`content/public-footer.json`) with the legal line from `@krizaka/org`; the founder reviews a local preview (light and dark,
phone and desktop) before any production apply. Open for the founder: whether to show a beaver shot on the home (upload
needed).
