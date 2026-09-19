# Karaoke Player

## Unified workspace (`/queue`)

`/queue` is a single full-screen page combining the player, queue, and
search so a user never has to leave the "now singing" screen to queue up
more songs:

```
┌─────────────────────────────┬──────────────────┐
│  Player (embed + controls)   │                  │
│                               │   Search panel   │
├───────────────────────────────┤  (compact list,  │
│  Up next — horizontal         │   Add to Queue)  │
│  drag-to-reorder strip        │                  │
└─────────────────────────────┴──────────────────┘
```

On screens below `lg`, the layout stacks vertically instead (player,
then the horizontal queue strip, then the search panel) rather than
splitting into columns.

```
apps/web/components/player/karaoke-workspace.tsx   Orchestrator — owns all shared state
apps/web/components/player/player-view.tsx          Presentational player (embed + controls)
apps/web/components/queue/queue-strip.tsx            Horizontal drag-reorderable "up next" strip
apps/web/components/search/search-panel.tsx          Compact sidebar search + results
apps/web/lib/youtube/use-youtube-player.ts            useYouTubePlayer hook (unchanged from Phase 5)
```

`KaraokeWorkspace` is the single source of truth for `nowPlaying` and
`upNext` — the player, the queue strip, and the search panel's
"queue full?" check all read from the same state, so adding a song from
search immediately affects what the Next button and Add-to-Queue buttons
see, without the three surfaces drifting out of sync.

## Behavior

- **Auto-advance on video end** — unchanged from Phase 5:
  `play_next_queue_item` marks the finished item `completed` and promotes
  the next `queued` item to `playing`, all in one transaction.
- **Next / Skip removes the previous song from view** — once a song is
  marked `completed` or `skipped`, `getUserQueue()` no longer returns it
  (only `queued`/`playing` rows are fetched), so it disappears from both
  the strip and the "now playing" slot the moment the workspace's local
  state updates. The row itself stays in the table as history (see
  `docs/DATABASE.md`).
- **Next is disabled with no next song** — `PlayerView`'s Next button is
  disabled whenever `upNext.length === 0`, not just when nothing is
  playing.
- **Add to Queue is disabled when the queue is full** — `SearchPanel`
  disables each result's Queue button once `queueCount >= queueLimit`
  (both live values from `KaraokeWorkspace`'s state), with a tooltip and
  inline notice. This is a UX convenience only — `add_queue_item` still
  enforces the real limit server-side (see `docs/DATABASE.md`), so a
  stale client can never actually queue past the limit even if the
  disabled check is momentarily out of date.

## `/search` still exists

The original Phase 3 grid-based search page (`/search`) is untouched and
still works standalone — useful for browsing without the full workspace
chrome. `/queue` is the primary "playing karaoke" screen; `/search` is a
lighter-weight alternative entry point.

## Bug fix: `loadVideoById is not a function`

`new YT.Player(...)` returns an object synchronously, but its real methods
(`loadVideoById`, `playVideo`, ...) aren't attached until the internal
iframe finishes loading and fires `onReady`. Calling a method before that
throws. `useYouTubePlayer` now guards every call through a
`callWhenReady` helper and queues a requested video (`pendingVideoIdRef`)
if it arrives before the player is ready, flushing it once `onReady`
fires. This also fixed a related latent bug: the player target `<div>`
is now **always** rendered by `PlayerView` (previously it was skipped
entirely when the queue was empty), so the hook always has a mount target
from first render regardless of queue state.

## Default (docked) layout fills the screen with no scroll

On `lg`+ screens, `/queue`'s docked layout now fills the viewport exactly
(`lg:h-full` chain from `<main>` down through `KaraokeWorkspace`) with no
page-level scrollbar: the player takes the flexible remaining space
(`flex-1 min-h-0`) above the fixed-height "Up next" strip, and the search
sidebar scrolls internally within its own column. Below `lg`, the layout
reverts to natural stacking (player, strip, then a scrollable search
section) since three full panels can't reasonably fit one small screen
without scrolling.

## Fullscreen karaoke mode

`/queue` supports an immersive fullscreen mode, entered via the
Fullscreen button next to the normal player controls (or exited via the
floating control bar's minimize button, the OS/browser's native fullscreen
exit, or <kbd>Esc</kbd>).

```
apps/web/lib/use-fullscreen.ts                Wraps the browser Fullscreen API
apps/web/lib/use-idle-visibility.ts             Auto-hide-on-inactivity for floating controls
apps/web/components/player/fullscreen-top-controls.tsx   Floating Stop/Next/Exit bar
apps/web/components/player/fullscreen-search-panel.tsx   Floating collapsible search
apps/web/components/player/fullscreen-queue-bar.tsx      Floating title-only horizontal queue
```

### The player is never recreated

`useFullscreen` calls `document.documentElement.requestFullscreen()`
rather than fullscreening a specific sub-element. Critically,
`KaraokeWorkspace` renders exactly **one** `<PlayerView>` instance in a
fixed position in the component tree at all times — entering/exiting
fullscreen only changes its `immersive` prop, which toggles CSS
(`fixed inset-0` full-viewport vs. a normal docked card). The
`<div id="karaoke-youtube-player">` target — and the YouTube iframe that
replaces it — is therefore never unmounted, so playback position and
state survive the transition exactly as the spec requires. (An earlier
approach that conditionally rendered two separate `<PlayerView>` elements
for docked vs. fullscreen was rejected during development specifically
because it would have destroyed and recreated the player on every
toggle.)

### Layering

Z-index tokens are defined once in `tailwind.config.ts`
(`z-video` 0, `z-video-overlay` 10, `z-queue` 20, `z-search` 30,
`z-top-controls` 40, `z-dialog` 50) instead of ad hoc values, per the
spec's layering requirement.

### Behavior

- **Top controls** — Stop, Next (disabled with no next song, same rule as
  the docked player), and Exit. Auto-hides after 3s of inactivity via
  `useIdleVisibility`; any mouse move, tap, or keypress brings it back.
- **Search panel** — collapsed by default (a floating search icon button);
  expands into a glass-panel list with a short Framer Motion slide/fade,
  matching the spec's animation direction. Uses the same `SearchPanel`
  component as the docked sidebar (`bare` prop drops its own header
  chrome since the floating shell provides one), so Add-to-Queue
  disabling when the queue is full is identical logic, not a fork.
- **Queue bar** — floating, bottom-anchored, horizontal-scrolling,
  **title text only** (no thumbnails/channel/metadata) per the spec. The
  currently-playing chip gets a neon highlight + animated equalizer and
  auto-scrolls into view (`scrollIntoView`) whenever the current song
  changes. Collapsible to a compact `QUEUE 8 / 15` pill.
- **No YouTube UI hacks** — the app only sets supported `playerVars`
  (`rel`, `modestbranding`) and reacts to the standard `onStateChange`
  event; it never attempts to cover, intercept, or manipulate YouTube's
  own UI/end-screen with overlays.

## Reverted: strict no-scroll docked layout

The earlier "fill the screen with no scroll" docked layout was reverted
per follow-up feedback. The docked (non-fullscreen) player is back to a
normal `aspect-video`, full-width card; the left column
(player + "up next" strip) and the page as a whole scroll naturally again
on `lg`+ screens (`lg:overflow-y-auto` on the left column) instead of
being clipped to exactly the viewport height. Fullscreen mode is
unaffected — it still uses `fixed inset-0` to cover the full viewport
regardless of the surrounding page's scroll behavior.

## Navigation hidden in fullscreen

`AppNav` is now hidden while fullscreen is active. Fullscreen state used
to live inside `KaraokeWorkspace` itself, which couldn't reach `AppNav`
(a sibling in the page). It was lifted into a new client wrapper,
`QueueScreen` (owns `useFullscreen`, conditionally renders `AppNav`, and
passes `isFullscreen`/`onToggleFullscreen`/`onExitFullscreen` down to
`KaraokeWorkspace` as props instead of `KaraokeWorkspace` calling
`useFullscreen` itself). `/queue`'s page component now just fetches data
and renders `<QueueScreen>`.

## Bug fix: "An error occurred" on the already-playing song after navigation

**Root cause:** the `YT.Player` constructor never received a `videoId`, so
every fresh mount of `KaraokeWorkspace` created a player with nothing
cued at all — regardless of whether the server already knew a song was
`playing`. This surfaced as YouTube's generic "An error occurred. Please
try again later." overlay in two situations that are really the same
underlying bug:

1. **Navigating away and back** to `/queue` with a song already playing
   — the page remounts, a brand-new `YT.Player` is constructed with no
   video, and pressing Play calls `playVideo()` on an empty player.
2. **Loading a playlist in "replace" mode while a song was already
   playing** — `load_playlist_into_queue` intentionally leaves the
   `playing` row alone (only `queued` items are replaced, see
   `docs/DATABASE.md`), so after the `router.push("/queue")` navigation,
   the exact same "existing `nowPlaying`, freshly mounted player" state
   occurs.

**Fix:** `useYouTubePlayer` now accepts an `initialVideoId` (the
server-rendered `nowPlaying` item's video id, if any) and passes it
straight into the `YT.Player` constructor's own `videoId` option, which
cues — but does not autoplay — that video immediately. No autoplay
policy is violated: the video is ready the instant the user presses Play,
instead of the player having nothing loaded at all.

As a second line of defense, the hook now also handles the player's
`onError` event by retrying the same `loadVideoById` call once, in case
of a genuinely transient YouTube-side hiccup unrelated to this bug.

## Removed: the pink neon glow shadow

`shadow-glow` (the magenta `box-shadow` token in `tailwind.config.ts`)
has been removed from every component that used it — the video player
card, buttons, dialogs, the landing page hero, and all of the fullscreen
overlay components (search panel, queue bar). The `shadow-glow` Tailwind
utility itself is still defined (unused now) in case a future design
pass wants to reintroduce a more subtle version of it; `shadow-glow-blue`
was untouched since it wasn't part of this request.
