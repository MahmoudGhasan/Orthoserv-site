# Scene validation

| Check | Result |
|---|---|
| 1440×900: console right, copy foreground left, independently moving handpiece | PASS — visually reviewed |
| 1024×900: no horizontal overflow; local photos loaded and not upscaled | PASS |
| 768×1024: responsive composition and cable path | PASS |
| 390×844: stacked, no pinning, sticky quote access | PASS |
| Source photo widths at all tested sizes ≤884 CSS pixels | PASS — computed widths inspected |
| Console and handpiece source pixels/logos preserved | PASS — nondestructive CSS masks; no flips |
| Reconstructed hose remains connected at both ends | PASS — live anchors visually checked in debug mode |
| Directional waves originate at the transformed handpiece tip | PASS — original coordinate mapped through layer transform |
| Skip animation stops movement and pinning | PASS — state inspected in browser |
| Reduced-motion static path | PASS — forced QA path tested; actual OS preference is wired through matchMedia but OS setting was not changed |
| AR/EN switching and fixed composition | PASS |
| Console errors in tested paths | PASS — none observed |
| Local runtime resources | PASS — HTML/CSS/JS references checked; no remote fetch/CDN |
| Scene JavaScript under 60KB, excluding GSAP/ScrollTrigger | PASS |
| Lighthouse Performance ≥90 / 60fps on a physical midrange phone | NOT MEASURED — no score or device frame-rate claim is made |

The original cable loop is deliberately not retained: the user requested a new connected hose route behind the copy. Masks isolate the actual console and handpiece without altering their photographic pixels.


Art direction revision: quieter typography and material, smaller handpiece, relaxed cable geometry, reduced idle motion and pulse opacity. Pending distributor/regulatory details retained in dialog. Checked Arabic/English, mobile 390px (no horizontal overflow, source render widths 361.531/351.719px), browser warnings/errors: none. Hosted publication remains blocked as previously reported.

Official hose revision: official transparent EMS image 848x548 saved locally; handpiece photo and photograph-derived hose texture replace synthetic SVG. Hose path is remapped in canvas. Desktop/mobile reviewed, mobile no horizontal overflow, skip/resume working, no browser errors/warnings. JS syntax passes.

Console replaced by official transparent front-view 1080x1080 PNG. Rendered source width desktop 841.359px, mobile 399.25px: below native. No horizontal overflow at 1440/390px; no console warnings/errors. Updated console hose anchor.

Hose join correction: retained longer original photographic hose neck, moved overlap away from connector, matched transformed source tangent and endpoint thickness to handpiece scale. Desktop/mobile visually reviewed; no browser warnings/errors.

Collection section implemented: four EMS model cards, local official images, shared products.json, model detail dialogs, AR/EN. Native scroll drives handpiece/hose transition, no pin; reduced-motion uses static view. Landing rotation aligns tip horizontally left toward heading (59+121=180 degrees), no mirror. Browser desktop inspected; no warnings/errors. Mobile cards and translations inspected; large decorative overflow clipped horizontally.

Layout refinement: consistent 1368px content container, adjusted console/handpiece proportions, aligned support copy/actions, balanced collection heading, equal card text space, larger mobile product cards, opaque header, minimum 14px interface text. Inspected desktop 1440px, tablet 768px and mobile 390px; AR/EN toggle checked; no horizontal overflow on mobile/tablet; browser warning/error log empty. Preserved user-approved buttons-up landing pose and photograph-derived hose.
