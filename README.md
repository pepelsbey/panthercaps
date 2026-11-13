# Panthercaps

A lyrics prompter for stage use. A static site with no backend: songs live in the browser's `localStorage`, and a service worker caches the app so it works offline.

## Browser support

The target is Safari on iOS 12.5.8, the last version for the iPad Mini 2, and everything newer. That's why the app is written in ES5 with no modules, and the CSS avoids features that iOS 12 lacks, like flexbox `gap`. The target is set in `browserslist` in `package.json`, and `npm test` checks the code against it:

- ESLint only accepts ES5 syntax in `src/`, and `eslint-plugin-compat` flags browser APIs that iOS 12 lacks.
- Stylelint flags CSS features that iOS 12 lacks. The few that it supports only partially, but well enough, are listed with reasons in `stylelint.config.js`.

The linters don't catch everything, like methods on built-in objects or Safari bugs, so test changes on the iPad too.

## Hosting

The app lives in `src/`, and the site is built from it into `dist/`: the app files, the lyrics bundled into `songs.js`, and `sw.js` stamped with the list of files to precache and a version based on their contents. Devices fetch the new files only when that version changes. `dist/` isn't committed.

Every push to `main` runs `.github/workflows/pages.yml`, which tests, builds and publishes `dist/` to GitHub Pages. In the repository settings, set Settings, Pages, Source to "GitHub Actions". All paths are relative, so it works under `https://user.github.io/repo/`.

## Preloaded songs

Every `.md` file in `lyrics/` is a song. The first line is the title, then come the lyrics, one line per line. Put chords and cues on their own line as `>` blockquotes, so they're highlighted:

```md
# Treble

> Em – Ddur – Am
City light reflections in the puddle, down below
```

The lyrics are used as they are, so it's the same format as in the app's editor. Without a `# Title` line, the file name is used as the title. The file name also identifies the song, so renaming a file adds it to devices as a new song.

On a device, each preloaded song is added once, at the end of the setlist, in alphabetical order. If you edit a file later, the song updates on the device unless it was edited there. A song deleted on the device doesn't come back.

## Using it on the iPad

1. Open the URL in Safari and wait for the green "✓ Offline" badge.
2. Share, then Add to Home Screen. The installed app keeps its own songs, separate from Safari tabs, so add your own lyrics inside it. The songs from `lyrics/` are already there.
3. Add songs with **+ New**. The pencil button changes or deletes a song, and **Reorder** moves songs around the setlist by their handles.

Songs are stored only on the device, so there is no sync. **Export** shows the whole setlist as text in the `lyrics/` format, each song starting with its `# Title` line: copy it somewhere safe, or split it into files in `lyrics/` to keep the songs in the repository.

Set Settings, Display & Brightness, Auto-Lock to Never so the screen stays on during the show.

## Development

```sh
npm install                # once, needs Node.js 22 or newer
npm start                  # dev server for dist/ on :8080, rebuilt on every page load
npm test                   # lint against the browser support target, then run the unit tests in test/
npm run build              # build dist/ without serving it
node tools/make-icons.js   # after replacing src/icons/512.png, make the other sizes
```

The service worker only works on localhost or HTTPS, so opening the dev server on the iPad by its network address skips offline mode. The service worker also serves the cached version first, so after a change reload twice.

The icon's source is `src/icons/512.png`, a square PNG without transparency, because iOS rounds the corners itself. `tools/make-icons.js` needs ImageMagick and zopflipng (`brew install imagemagick zopfli`). Its results are committed, so the build only copies them.

`tools/inspector.js` drives a connected iOS device's page through `ios_webkit_debug_proxy` (screenshots, eval). It is optional tooling.
