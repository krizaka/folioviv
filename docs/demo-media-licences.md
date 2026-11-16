# Demo media licences (krizaka-internal#3751, showcase #3742 §3)

Photos of the four demo shops: real photographs under the **Unsplash License** (commercial use, no attribution required; we credit anyway). Unsplash+ and Getty Images are excluded.
Nothing is downloaded into this repository: the files go to the media storage by logical key (`sites/folioviv/demo/<slug>/…`, krizaka-internal#2333 §6), not to Bunny (krizaka-internal#3204).
**Status** `à vérifier` = the team has not yet confirmed on the Unsplash page the line « Free to use under the Unsplash License », the light and the face; `vérifié` = confirmed on the date given.
**Face** `aucun` = no recognisable face; `à vérifier` = to check before upload. Upload waits for the founder's decision 1 (krizaka-internal#3742).
A row is machine-read by `packages/db/src/demo-media-licences.test.ts`: every column is filled, the URL is an unsplash.com photo page.

| Shop               | Slot                  | URL                                                                                                                           | Author            | Licence          | Date       | Face       | Status     |
| :----------------- | :-------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :---------------- | :--------------- | :--------- | :--------- | :--------- |
| pattes-saint-henri | cover                 | https://unsplash.com/photos/litter-of-dogs-fall-in-line-beside-wall-U6nlG0Y5sfs                                               | Hannah Lim        | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| pattes-saint-henri | group walk            | https://unsplash.com/photos/four-dogs-sitting-on-a-path-outdoors-together-XvHy22eWetU                                         | James Haworth     | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| pattes-saint-henri | solo walk             | https://unsplash.com/photos/person-walking-beside-golden-retriever-on-the-street-VehdYPKnX8Y                                  | Andriyko Podilnyk | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| pattes-saint-henri | puppy visit           | https://unsplash.com/photos/a-golden-retriever-puppy-walks-on-a-leash-outside-v-WVryDsM0I                                     | Florian Schindler | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| pattes-saint-henri | gallery 1             | https://unsplash.com/photos/woman-in-black-jacket-walking-with-black-labrador-retriever-on-pathway-during-daytime-sGV1QDMM0Gg | Martin Dalsgaard  | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| pattes-saint-henri | gallery 2             | https://unsplash.com/photos/man-beside-dog-walking-in-pathway-surrounded-by-trees-Z-M1sKVktGM                                 | Julia Vivcharyk   | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| pattes-saint-henri | the neighbourhood     | https://unsplash.com/photos/abandoned-grain-elevator-with-graffiti-iH5EfnhDzto                                                | Martin Dubé       | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| cedre-ciseaux      | cover                 | https://unsplash.com/photos/salon-chairs-with-mirrors-and-products-jsuWg7IXx1k                                                | Greg Trowman      | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| cedre-ciseaux      | workstation           | https://unsplash.com/photos/barber-chair-in-modern-salon-workspace-N15dzf3dAUk                                                | Stefan Vibes      | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| cedre-ciseaux      | cut and blow-dry      | https://unsplash.com/photos/a-woman-getting-her-hair-done-in-a-salon-PnDr2j28gXA                                              | Daniel            | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| cedre-ciseaux      | beard, short cut      | https://unsplash.com/photos/barbers-cutting-hair-in-a-modern-salon-BX8OTlmHOaI                                                | Chaps & Co        | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| cedre-ciseaux      | gallery               | https://unsplash.com/photos/a-modern-hair-salon-interior-with-stylish-chairs-and-mirrors-_Fy7Kq0w6OI                          | Barney Goodman    | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| encre-vive         | cover                 | https://unsplash.com/photos/DvUano9E0sQ                                                                                       | Haberdoedas       | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| encre-vive         | small tattoo 1        | https://unsplash.com/photos/zeT_i6av9rU                                                                                       | Lucas Lenzi       | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| encre-vive         | small tattoo 2        | https://unsplash.com/photos/hxNiXP498UI                                                                                       | Allef Vinicius    | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| encre-vive         | consultation, drawing | https://unsplash.com/photos/koo_vYrlU_U                                                                                       | Matthieu Comoy    | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| ferland-conseil    | cover                 | https://unsplash.com/photos/lbO1iCnbTW0                                                                                       | Vadim Bozhko      | Unsplash License | 2026-11-16 | à vérifier | à vérifier |
| ferland-conseil    | working session       | https://unsplash.com/photos/5fNmWej4tAA                                                                                       | Scott Graham      | Unsplash License | 2026-11-16 | aucun      | à vérifier |
| ferland-conseil    | 3-hour block          | https://unsplash.com/photos/9OGNpJPVMZ8                                                                                       | Kelly Sikkema     | Unsplash License | 2026-11-16 | aucun      | à vérifier |

## Still to find (no photo yet; the service has no thumbnail until then)

- cedre-ciseaux: colour, balayage (a colour bowl and its brush).
- encre-vive: portrait photo session (a lit studio, no recognisable model).
