# Prompter

A lyrics prompter for stage use. A static site with no backend: songs live in the browser's `localStorage`, and a service worker caches the app so it works offline. Written in ES5 and old-Safari-safe CSS so it runs on iOS 12 (iPad Mini 2).

## Hosting

Serve the repository root over HTTPS (for example GitHub Pages: Settings, Pages, deploy from the `main` branch, `/ (root)`). All paths are relative, so it also works under `https://user.github.io/repo/`.

After changing `index.html`, `style.css`, `app.js`, `icon.png` or `manifest.webmanifest`, run this before publishing so devices fetch the new files:

```sh
node tools/build-sw.js
```

## Using it on the iPad

1. Open the URL in Safari and wait for the green "✓ Offline" badge.
2. Share, then Add to Home Screen. The installed app keeps its own songs, separate from Safari tabs, so add your lyrics inside it.
3. Add songs with **+ New**. **Edit** changes a song, moves it up or down the setlist, or deletes it.

Songs are stored only on the device, so there is no backup or sync.

Set Settings, Display & Brightness, Auto-Lock to Never so the screen stays on during the show.

## Development

```sh
node tools/serve.js        # static dev server on :8080 (service worker works on localhost only)
node tools/make-icon.js    # regenerate icon.png
```

`tools/inspector.js` drives a connected iOS device's page through `ios_webkit_debug_proxy` (screenshots, eval). It is optional tooling.
