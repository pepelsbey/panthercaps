/* Panthercaps: merges the songs bundled from lyrics/*.md (songs.js) into the device's setlist. Kept apart
   from app.js, with no DOM access, so test/preloaded.test.js can run it in Node. ES5 for iOS 12 Safari. */
/* exported mergePreloaded */

/* Each bundled song is added once, at the end of the setlist, and is never re-added after the user deletes
   it. A later change to its file updates the song on the device, unless it was edited there. `preloaded`
   remembers the version of each song that was last delivered, by id. Both `songs` and `preloaded` are
   updated in place. */
function mergePreloaded(songs, preloaded, bundled) {
	"use strict";
	bundled.forEach(function (p) {
		var seen = preloaded[p.id], song = null;
		songs.forEach(function (s) { if (s.id === p.id) song = s; });
		if (!seen) {
			if (!song) songs.push({ id: p.id, title: p.title, text: p.text });
		} else if (song && song.title === seen.title && song.text === seen.text) {
			song.title = p.title; song.text = p.text;
		}
		preloaded[p.id] = { title: p.title, text: p.text };
	});
}
