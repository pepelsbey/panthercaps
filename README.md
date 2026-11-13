# Panthercaps

A lyrics prompter for the stage. It scrolls the lyrics at the speed you set, highlights chords and cues, and works without a network once it's installed. Made for the iPad: anything with iOS 12.5 or newer, down to the iPad Mini 2.

## Setting up the iPad

1. Open https://pepelsbey.github.io/panthercaps/ in Safari and wait for the green "✓ Offline" badge.
2. Tap Share, then Add to Home Screen, and from now on open the app from the Home Screen.
3. Set Settings → Display & Brightness → Auto-Lock to Never, so the screen stays on during the show.

The Home Screen app and Safari don't share songs. The songs from this repository are in both, but anything you add or change in Safari stays in Safari.

## Performing

Tap a song in the list to open it.

- Tap the lyrics to play or pause. Dragging them pauses too, so you can scroll to your place and tap to go on.
- The speed and text size buttons are remembered for each song.
- The arrows next to Play switch to the previous or next song in the setlist, and the button on the far right goes back to the top.
- The pencil in the top corner edits the song, and Save or Cancel brings you back to the same place. It hides while playing.

## Managing songs

- **+ New** adds a song. Lines starting with `>`, like `> Em – D – Am`, are highlighted as chords and cues.
- The pencil next to a song edits or deletes it.
- **Reorder** lets you drag songs around the setlist by their handles.
- **Export** shows all songs as text, so you can copy them somewhere safe.

Songs are stored only on the iPad, with no backup or sync, so export the ones you add there now and then.

The app updates itself: open it while online, and the new version loads the next time the app starts.

## Adding songs to the repository

Every `.md` file in `lyrics/` is a song, written the same way as in the app's editor:

```md
# Treble

> Em – Ddur – Am
City light reflections in the puddle, down below
```

The `# Title` line is optional: without it, the file name is the title. After a push to `main`, devices get the changes with the next update:

- New songs are added at the end of the setlist.
- A changed file updates the song, unless it was edited on the device.
- A song deleted on the device doesn't come back. Renaming a file adds it again as a new song.

An export from the app is in the same format, so split it into files to keep those songs here.

## Development

Needs Node.js 22 or newer.

```sh
npm install                # once
npm start                  # dev server on :8080, rebuilt on every page load
npm test                   # linters and unit tests
npm run build              # build dist/ without serving it
```

The app is in `src/`, and the build puts it together with the songs from `lyrics/` in `dist/`, which isn't committed. Every push to `main` tests, builds and publishes it to GitHub Pages. For a fork, set Settings → Pages → Source to "GitHub Actions".

The app has to run on iOS 12 Safari, so it's written in ES5 with no modules, and the CSS goes without newer features like flexbox `gap`. `npm test` catches most of that, but not everything, so try changes on the iPad too.

Offline mode works only on localhost or HTTPS, so the dev server opened on the iPad by its network address runs without it. Where it does work, the app shows the cached version first, so reload twice to see a change.

To replace the icon, put a square PNG without transparency in `src/icons/512.png`, run `node tools/make-icons.js` and commit the results. It needs ImageMagick and zopflipng: `brew install imagemagick zopfli`.

To debug on the iPad itself, `tools/inspector.js` takes screenshots, runs code and reads the console through `ios_webkit_debug_proxy` (`brew install ios-webkit-debug-proxy`). The usage is at the top of the file.
