# OrthoServ — DolorClast / independent product layers

The shock-wave scene only. No laser, stocking, next-scene placeholder or handover has been built. The previous parent landing remains paused.

## Composition

- Actual console and handpiece pixels are displayed independently from the supplied 884×817 transparent photograph, using nondestructive CSS masks. No generative product imagery is used in this live scene.
- The console stays fixed on the right. The handpiece is separately positioned behind the foreground headline, facing right, with a slight float, recoil and pointer response.
- A connected SVG hose replaces the original floor coil. Its endpoints track the original front connector and the handpiece inlet; spring-smoothed control points create delayed flex.
- A single canvas draws the directional pulses above the artwork and below the copy. Product logos, labels and controls are not mirrored or redrawn.
- Mobile uses a stacked composition, two rings and native scrolling. Smaller desktop windows also keep native scrolling when the full composition cannot fit safely inside a pinned viewport.

## Pulse timing and scroll — 6 lines

1. The first pulse starts after 600ms, then repeats every 1.4 seconds.
2. Scroll progress interpolates the interval to 0.55 seconds, ring count from 3 to 5, and maximum radius from 380 to 520 original-image pixels.
3. ScrollTrigger uses 0.6-second scrub smoothing; intensity is eased again before emission.
4. The handpiece travels only 20px horizontally and 12px vertically over the scroll range; its connector remains attached to the cable.
5. Canvas, handpiece and cable share GSAP's RAF ticker. Hidden/out-of-view animation pauses.
6. Skip/reduced-motion removes pinning and live animation. The console remains visible at the end; there is no scene exit.

## Coordinates

The original tip remains **73.0%, 27.5% = (645.32, 224.675)** with a **40°** axis and **±38°** cone. These values were not shifted. New cropped layers map that original point into the moving handpiece coordinate system. `?debug=1` shows the live tip, axis, cone and both cable endpoints. All geometry and principal motion settings are at the top of `js/layered.js` in `CONFIG`.

## Run

Serve this folder over HTTP, for example `python -m http.server 8000`, then open `http://localhost:8000`. All runtime fonts, images and scripts are local. `?motion=reduce` exercises the same static code path as a reduced-motion preference without changing OS settings.

PNG fallback and transparent WebP are both included. Equivalent conversion command:

```sh
cwebp -q 90 -alpha_q 100 assets/dolorclast.png -o assets/dolorclast.webp
```

`FULL-CODE.md` contains complete HTML, CSS and scene JavaScript in code blocks. `VALIDATION.md` records actual checks and limits. Quote/detail navigation is a scene preview only; there is no request submission or payment.

## Asset attribution

Supplied EMS DolorClast photograph: **DEMO ONLY: replace with brand-approved asset**. Original PNG is retained unchanged. GSAP 3.13.0 and ScrollTrigger are local official npm distribution files. Original IBM Plex Sans Arabic and Manrope fonts were converted losslessly to WOFF2 for delivery.

## Before any later scene

Await user review of the shock-wave composition and cable behavior. Later laser/stocking scenes need approved source images and their own agreed art direction. No later scenes are implemented here.
