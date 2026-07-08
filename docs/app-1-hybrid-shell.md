# APP-1 — Hybrid App Shell / WebView Internal Test Build

## Purpose

Package the existing Heyin H5 inside a Capacitor hybrid app shell for internal testing of app-specific behavior:

- Microphone permission flow (app-level vs browser-level)
- Recording inside WebView
- Audio playback compatibility
- Upload performance on mobile data

## Why Hybrid First

| Approach | Pro | Con |
|---|---|---|
| Capacitor WebView | Reuse 100% of H5 code; 1-2 day setup | WebView recording may have issues |
| React Native | Full native control | Months of rewrite |
| Flutter | Beautiful UI | Months of rewrite |

The H5 already works. Capacitor lets us test app-behavior without rewriting anything.

## Architecture

```
┌──────────────────────────┐
│   Capacitor App Shell    │
│  ┌──────────────────────┐│
│  │    WKWebView /       ││
│  │    Android WebView   ││
│  │                      ││
│  │  Heyin H5 (remote)   ││
│  │  EdgeOne / Vercel    ││
│  └──────────────────────┘│
│   Capacitor Bridge        │
│   (reserved for native    │
│    recording if needed)   │
└──────────────────────────┘
```

## Remote URL Strategy

The app loads the H5 from the configured remote URL:

```
HEYIN_APP_REMOTE_URL or NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL
```

The H5 is NOT bundled inside the app — it always loads from the web.

This means:
- H5 updates deploy to EdgeOne as usual
- App users get the latest H5 automatically
- No app store update needed for H5 changes

## Required Env Vars

```
NEXT_PUBLIC_HEYIN_PUBLIC_BASE_URL=https://your-domain.com
```

⚠️ Do NOT use EdgeOne temporary Preview URLs for the app. They expire after 3 hours.

## Android Setup

```bash
# First install
npm install
npx cap add android
npx cap sync android

# Run
npx cap open android  # opens in Android Studio
# OR
npx cap run android   # builds and runs on device
```

Permissions added in `android/app/src/main/AndroidManifest.xml`:
- `INTERNET`
- `RECORD_AUDIO`

## iOS Setup

```bash
npx cap add ios
npx cap sync ios
npx cap open ios  # opens in Xcode
```

Permission added in `ios/App/App/Info.plist`:
- `NSMicrophoneUsageDescription` = "Heyin needs microphone access so you can record your voice for chorus projects."

## Known Limitations

- This is NOT the final App Store / public release architecture
- WebView recording (MediaRecorder) may behave differently than browser
- EdgeOne temporary Preview URLs expire — use custom domain
- No native push notifications
- No offline support
- No deep linking
- Capacitor `server.url` is intended for development, not production

## Next Steps After APP-1

| If... | Then... |
|---|---|
| Recording works in WebView | APP-2: Internal App Distribution (APK/TestFlight) |
| Recording fails in WebView | APP-1.1: Native Recording Bridge |
| All stable | APP-3: App Store preparation |
