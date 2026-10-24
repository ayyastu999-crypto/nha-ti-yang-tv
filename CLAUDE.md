# Project handoff — Nhà mình TV

## User goal and accepted direction

The user requested a TV interface resembling a photo album, with small app tiles, a clock and a Vietnamese lunar calendar. They then requested a YouTube music bar with Top YouTube access and a **more modern appearance like Apple TV**. The delivered direction is the modern version: dark photographic background, large photo cards, rounded glass surfaces, a clock/calendar sidebar and colorful app tiles. Keep Vietnamese UI copy.

This archive is intended for continued development in Claude Code. Read `README.md` before editing. Do not assume this is a native tvOS or Android TV app.

## Architecture

- Static HTML, CSS and vanilla JavaScript modules. No framework, backend, build pipeline or runtime package dependency.
- `dist/` contains the editable app source and bundled images.
- `index.html` loads `style.css` FIRST and `modern.css` SECOND. The latter overrides the former. Do not delete the base stylesheet without retaining required layout/dialog/interaction rules.
- `app.js` imports `lunar.mjs`. Run over HTTP, not `file://`.
- `npm run dev` starts the local server at `http://127.0.0.1:5173`; no `npm install` is needed. `npm run check` checks JS syntax.
- The server is only a local preview helper. Any static hosting can serve `dist/`.

## State and existing features

- Demo album: six local photos, three spreads; full-photo dialog, uploaded photos, automatic page changes.
- IndexedDB: database `nha-minh-album`, store `album`, key `photos`. These are browser/origin-local user data and are NOT included in the source archive.
- Preferences: localStorage key `nha-minh-preferences`. Themes `warm`, `sage`, `night` map to Điện ảnh, Xanh đêm, Tối giản.
- Clock, lunar calendar, timer and keyboard spatial navigation are in `app.js`.
- The YouTube/Spotify/Netflix app tiles open external websites; they do not launch native TV apps.
- No user authentication, cross-device sync or server-side storage is implemented in this exported app.

## Accuracy and interaction details to retain

- Vietnamese time uses `Asia/Ho_Chi_Minh`. Lunar conversion uses UTC+7. Do not substitute `Intl` Chinese calendar for the Vietnamese lunar calculation.
- Preserve leap-month labeling and the lunar year name. Keep the Hồ Ngọc Đức attribution.
- Calendar D-pad navigation must use the day currently FOCUSED, not a stale selected-day variable.
- Checkbox Enter should toggle it; directional focus must be able to leave checkbox/select/range controls.
- Respect reduced motion. Keep dialogs keyboard accessible and focus states visible at TV viewing distance.
- User uploads remain local. Do not silently add uploads to a server or third-party service.

## YouTube

- Uses the official IFrame API, created after user action, with a visible `youtube-nocookie.com` player and controls (viewport 290×200 at 1920×1080). Keep it visible and at least 200×200.
- `topPlaylist` is YouTube's own auto-updated chart playlist "100 bài hát hàng đầu tại Việt Nam" (`PL4fGSI1pDJn4bRKr6tjRWaGlqRg_zY_is`), labelled "Top nhạc trẻ thịnh hành". YouTube refreshes it weekly; the app has no chart API of its own.
- Verified 24/10/2026 in a desktop browser at 1920×1080: playback starts, time advances, pause/resume, previous/next (order matched the weekly chart), seek, close, and switching selection before the iframe is ready (`initialMusicKey`). Audio output itself was not heard by the tester.
- Lofi Girl's stream returns error 150 (embedding disabled by the owner), so the relax preset is Chillhop Radio (`7NOSDKb0HlU`, live). Live videos show TRỰC TIẾP via `getVideoData().isLive`.
- Errors 100/101/150 show a specific message; inside a playlist up to five blocked songs in a row are skipped automatically (skip path not yet hit in testing). After an error the progress readout stops until the next successful play.
- Do not extract audio streams or bypass YouTube playback restrictions.

## Changes on 24/10/2026

- Brand and copy: "nhà mình" → "nhà Tí Yang" in all UI text. Storage keys (`nha-minh-*`) are unchanged on purpose so saved photos and preferences survive.
- Album: autoplay is on at load, 3 seconds by default (options 3/8/15/30 s); spreads slide in sideways (`spread-slide-next`/`-back` in `modern.css`), disabled under reduced motion by `style.css`.
- TV fit: `dist/tv-fit.js` (loaded first, classic script) runs the app inside a frame laid out at ≥1280×720 and scaled down when a landscape viewport is smaller (Android TV browsers report 960×540 or less). `app.js` is wrapped in `if(!window.__tvFit)` so the outer page stays idle; fullscreen targets `window.top`.
- Remote keys: Back (`Backspace`/`GoBack`/`BrowserBack`) closes an open dialog and is otherwise left to the browser; media Play/Pause/Next/Previous drive the music bar. Home, volume, mute, power and input stay with the TV.
- Home styles: `preferences.layout` = `modern` | `tet` | `cinema` | `auto` (default; Tết from 23/12 to 10/1 lunar). The Tết style is `body.layout-tet` + `tet.css` + `tet-layout.mjs` (calendar sheet, wishes, countdown, mai blossoms); it only overrides modern.css, so the DOM and remote navigation are shared. The cinema style ("Rạp chiếu ảnh") is `body.layout-cinema` + `cinema.css` + `cinema-layout.mjs`: the current album (family photos on the TV) fills the screen behind the page, one photo per 9 s with a Ken Burns zoom and cross-fade, honouring the play/pause button; portrait photos are shown whole over a blurred copy; no backdrop-filter (too heavy over a moving photo on a TV GPU). Add further styles the same way.
- D-pad navigation: candidates must lie wholly past the focused edge, scored like Android's FocusFinder (13 × edge gap² + centre offset²); Left/Right stay within the same row and stop at its end.

## Deployment

- Live at https://ayyastu999-crypto.github.io/nha-ti-yang-tv/ (GitHub Pages from branch `gh-pages`, which holds `dist/` only). Deploy with `git subtree push --prefix dist origin gh-pages` after committing to `main`.

## Android TV launcher (`android/`)

- `vn.tiyang.home`: a WebView HOME activity that loads the live site, falling back to the copy of `dist/` bundled as
  APK assets (served at `https://appassets.androidplatform.net/`) when offline. `sw.js` caches the shell so Home
  reloads (the TV kills the launcher to free memory) are instant.
- `window.TiYangTV` bridge (`TvBridge.java`): `isInstalled`, `launchApp`, `hasAppLabeled`, `launchByLabel`,
  `openStoreSearch`, `openInputs`, `openTvSettings`. `app.js` turns on `.tv-launcher` mode only when it exists.
- Back/Home in the app dispatch a `GoBack` key into the page; the activity never finishes. Use plain
  `requestFocus()` — a directional request makes WebView jump to the first control and overrides the restored focus.
- Verified on the MiTV-MOOQ0 (Android 10) on 24/10/2026: every tile opens its app, Home returns, boots into it.
- The "AYYA Studio" tile opens `vn.ayyastudio.home`, the studio's project showcase (a separate app, built from
  the sibling `ayya-studio-tv` project); like every `data-package` tile it hides itself when that app is not installed.

## Scope of future work

Start with the user's next concrete request. Preserve the existing app and accepted design. Framework migration, backend, TV packaging or additional paid services are separate implementation choices; do not introduce them merely to run this project.

The archive contains no deployment credentials or pre-existing Git history. Create a new repository if requested. Do not assume access to the original hosted account.
