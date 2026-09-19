# Mobile

## Android app

`apps/mobile` is an Expo (React Native) app using Expo Router, targeting
Android first (package: `com.karaokequeue.app`). It shares business logic
and types with the web app via `packages/shared`, `packages/validation`,
and `packages/database` — it never wraps the web app in a WebView.

## Local development

```bash
pnpm dev:mobile                # starts the Expo dev server
pnpm --filter mobile android   # opens on a connected device/emulator
```

## Build / export

```bash
pnpm --filter mobile build     # expo export --platform android
```

`expo export` and `expo start` normally reach Expo's API (e.g. to check
native module version compatibility). In network-restricted environments
(CI runners or sandboxes without access to `api.expo.dev`), set
`EXPO_OFFLINE=1` to skip that online check:

```bash
EXPO_OFFLINE=1 pnpm --filter mobile build
```

This isn't needed for normal local development with internet access.

## Notes

- Auth sessions persist via `@react-native-async-storage/async-storage`
  (wired up when the Supabase client is added to the app in Phase 1/8).
- Android back-navigation and gesture support come from
  `react-native-gesture-handler` and `react-native-reanimated`, already
  installed as dependencies.
