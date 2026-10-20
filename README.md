# OrthoServ storefront — Concept A / Phase 3

Static front-end demo. Serve this folder with a static HTTP server and open index.html through that server. All images, fonts, and the two embedded experiences are local.

## Catalogue

`products.json` is the single catalogue used by all storefront views. Edit names, categories, images, image roles/native dimensions, methods and prices there. `price: null` with `method: quote` means request a quote. DEMO consumables use clearly marked illustrative prices. Four HIGHCARE consumables also support demo purchase at the per-box prices explicitly supplied in the client PDF (70/80/75/80 SAR); their tax treatment and availability require confirmation. No real purchase is made.

The client's spreadsheet contributes only four large devices: Hydrocollator M-4, M-2, ARTROMOT-K1 and a rehabilitation treadmill. All other spreadsheet entries are excluded. Manufacturer/model details must be reviewed before commercial launch. ARTROMOT has a neutral placeholder because the available spreadsheet image is lifestyle.

Blueneem: 17 entries imported from the manufacturer's Multi-Speciality Products page, with local original-resolution photos, source page links and native dimensions. Availability, pricing, sizes and OrthoServ distribution status are not asserted. Images: DEMO ONLY: replace with brand-approved asset. See BLUENEEM-SOURCES.json.

## Features

The footer displays the legal entity name, address, building number, commercial registration, VAT number, national address short code and postal code supplied in the client's 20 October 2026 image. The legal Arabic name is retained verbatim in both interface languages; labels and address descriptions are translated. These details have been transcribed from the supplied image, not independently registry-verified.

Arabic/English toggle in the header changes interface direction and UI copy and saves the language preference locally. Supplied bilingual technical specification text remains source material. Five selected equipment entries support a distinct Request a demo action on cards and product pages: MED4, DolorClast, Winback, LightForce and RehaMoto. The preview form collects a preferred demo format/date but does not transmit data, reserve stock or confirm appointments. Eligibility is controlled by demoEligible in products.json.

Navigation separates product categories from brands. The five categories appear consistently on home, the shop menu and catalogue sidebar: rehabilitation, fitness, medical compression (Juzo experience), consumables and multi-speciality medical products. Blueneem is a brand within the final category. Brand links use shareable hash routes to filtered collections. Click/keyboard-operated menus close with Escape or outside focus; contact is a demo form with no transmission.

RTL responsive homepage, catalogue categories, search, brand/type/order-method filters, sorting and pagination; product views with galleries and example variants; favourites; persistent local cart with quantity updates, removal and totals; demo checkout and quote/B2B forms. Forms never send or save contact details; no payment API or real ordering exists. DEMO prices are inclusive illustrative prices, with no real shipping charge computed.

Shop data/favourites/cart use localStorage on this browser. Contact fields are disposable in-memory demo form inputs.

## Experiences and campaign

The home hero is a three-scene carousel: OrthoServ, animated Juzo leg concept, and the approved EMS scene embedded using its original shared motion code and photographs. Only embed framing adapts it to the carousel; the standalone scene remains available. It advances every 7.6 seconds while visible, with dots, previous/next, pause, touch swipe, keyboard navigation, hover/focus pause, reduced-motion support and route cleanup. Native scrolling remains unchanged and products follow the hero immediately.

The former large Juzo/EMS banners are replaced by a compact mixed recommendation rail (Juzo, Spirit, LiKAWAVE and Game Ready). The trust section contains the Saudi-market start year (2009), 24 brand/technical partner identities and 13 client/healthcare identities. Original Our Clients and Our Partners assets were imported from orthoserv.com, preserving their section classifications and removing a decorative icon and a duplicated legacy identity. home-identities.json is the displayed source of truth; ORTHOSERV-LOGO-SOURCES.json documents downloaded originals and exclusions. White margins are framed with CSS using recorded bounds; original files are not cropped, recoloured or upscaled. Manufacturer sources remain in IDENTITY-SOURCES.json. Agency claims for Game Ready, Winback, Blueneem, Juzo and LiKAWAVE were explicitly supplied by the client; other brand logos are presented as partners, not as exclusive agencies.

Brand logos move slowly from left to right; client logos move right to left. Tracks repeat seamlessly, pause on hover/focus or their pause button, and respect reduced motion. Speeds are calculated from actual group width (18/20 CSS pixels per second) so adding logos does not accelerate the rail. Duplicate visual tracks are hidden from accessibility and keyboard focus.

RoboClinic: assets/identity/roboclinic-cleanup-proof.png is an approximate main-logo reconstruction made with the built-in image tool from the client's low-resolution screenshot. The tiny illegible tagline lines were deliberately omitted. This is a temporary cleanup proof, not original official artwork. Replace when an original is available. Specialist Clinics remains deferred as requested. Hayat's official legacy site redirects to hayathealth.com; the current identity from that destination is used.

Two LiKAWAVE VARIO models, 3i and 2i, were added to the rehabilitation/shockwave catalogue with distinct manufacturer images and quote-only ordering. Images are capped at native size and must be brand-approved for commercial use. No clinical performance or regulatory claims were added.

`experiences/shockwave/` and `experiences/juzo/` preserve the two separate prototypes. Home campaigns, navigation and the animated Juzo side advert link to these portable relative paths. The ad uses the previously generated grey-leg concept as an illustrative animated creative, not a product photo. Pause/close and reduced-motion handling are supported. Juzo colour choices do not recolour product photography.

The original OrthoServ raster logo is preserved. CSS darken blending merges its near-white background with the light header/footer. An SVG alpha filter that caused a black rectangle was removed. A generated background-removal candidate was rejected and is not included.

## Status

Local review only. The existing hosted Concept A site has not been overwritten. Its Sites project ID remains appgprj_6ad5b8c5e0d4819188ea86a4f4e0ad9e. Publishing still requires the authorised official Sites source synchronisation workflow; the earlier credential handoff route was blocked by automatic approval review. No credentials or source repository state are packaged here.

## Verification

Prior to the user's request to handle testing themselves, the initial storefront passed a desktop purchase flow (variant, quantity 2, total SAR 90, demo confirmation and empty cart), search for Hydrocollator (two results), JS syntax and local HTTP 200. The final audit checks all JavaScript syntax, JSON, local HTML/CSS references, product media dimensions, duplicate IDs, price provenance, and logo paths. Focused desktop review confirms consumables filters, AR/EN direction, HIGHCARE sizes and the per-box cart total, with review items removed afterwards. Mobile styles have been reviewed in source; a dedicated device run remains for user testing. FINAL-AUDIT.json records the latest actual results.

## Final stage handoff — 20 October 2026

40 storefront products, 16 catalogue brand labels, 24 partner-brand logos and 13 client logos. HIGHCARE stays under consumables / wound care; it is not a separate product category. PDF-extracted images are used on cards and product pages; single-pack 13 x 100 mm photos are only used for that size, and the supplied range image represents other sizes. All four entries link to the unchanged supplied PDF. The user-approved SMC Hospital logo supersedes both earlier SMC imports. The approved shockwave motion file is byte-identical to the original standalone source.

See FINAL-REVIEW.md for implemented items, remaining source-asset limitations, preview/publishing status and scope. All three experiences are included in this single folder and archive. No approval credentials or local browser storage are included.
