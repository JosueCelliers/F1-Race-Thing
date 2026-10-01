# Chequered Lives

*Spin a driver. Live the career. Build a legacy.*

A racing-career game for **iOS and Android**, built with React Native and Expo. Spin a series of wheels to create a racing driver: nationality, family, debut age, pace, racecraft, wet-weather skill, driving style, personality, potential, first championship and team. Then live their whole career in one persistent, connected motorsport world:

- The open-wheel ladder: **Formula Cadet → Formula Contender → Formula Apex → Formula Prime**
- The **Global Endurance Championship**, with the **24 Hours of France**
- The **American Open-Wheel Championship**, with the **Heartland 500**
- The **GT World Series**, with the **Kurrajong 1000**

Watch races on a 2D broadcast map and make the calls that matter: send it, defend, pit under the safety car, gamble on slicks in the rain, obey or ignore team orders. The big moments come back as short 2D replays. Between races, life happens: rivalries, sponsors, podcasts, setup thieves.

When a career ends, it goes into **The Archive**, filed as a Legend, Champion, Cult Hero or Disaster, with its glory and heartbreak reels. The world then moves on. Your old rivals keep racing, your records stand, a former driver of yours may run the team, and your next driver might be your last driver's kid.

All series, teams, sponsors, circuits and people are fictional. See `ASSET_LICENSES.md`.

## Play it on your phone

Requirements: Node.js 20 or newer, and the **Expo Go** app from the App Store or Google Play (it must support Expo SDK 57).

```bash
npm install
npx expo start          # scan the QR code (Camera app on iOS, Expo Go on Android)
npx expo start --web    # quick preview in a desktop browser
```

## Build installable apps

Release builds use [EAS Build](https://docs.expo.dev/build/introduction/). The profiles are in `eas.json`.

```bash
npm install -g eas-cli
eas login

# Android: an APK you can install directly on a phone
eas build -p android --profile preview

# iOS: an internal build for registered devices (needs an Apple Developer account)
eas build -p ios --profile preview

# Store builds (AAB / IPA), then upload them
eas build -p android --profile production
eas build -p ios --profile production
eas submit -p android
eas submit -p ios
```

Local native builds work too: `npx expo run:android` (needs Android Studio) or `npx expo run:ios` (needs Xcode on a Mac).

The app identifiers are `com.chequeredlives.app` on both platforms, set in `app.json`.

## Develop

```bash
npm run typecheck       # TypeScript
npm run lint            # ESLint (eslint-config-expo)
npm run format          # Prettier
npm test                # simulation unit tests (vitest)
npm run sim -- 6 1234   # headless: build a world, auto-play 6 careers, print a summary
```

In development builds, two extra routes help with art work. `/dev` is a gallery of portraits, flags, helmets, cars, badges and tracks. `/dev-highlight?kind=crash&car=gt&env=city&night=1` plays any replay scene.

### Code map

| Folder | What lives there |
| --- | --- |
| `src/content` | Data only: nations, name pools, series, teams, circuits, environments, life events, traits, portrait part metadata |
| `src/sim` | The game simulation in pure TypeScript with no React: seeded RNG, world, driver market, race engine, decision moments, careers, legacy and records |
| `src/art` | Original vector art: portraits, helmets, cars and liveries, flags, track maps, badges |
| `src/highlights` | 2D replay scenes (side, top-down, start, pit stop, podium, title) and particle effects |
| `src/race` | The race weekend: broadcast HUD (position plate, lap counter, telemetry, battle board, event lower third, playback dock), track view, decision sheet, pre-race poster, grid and result |
| `src/creation` | Driver creation: the spin HUD (progress rail, step lockup, result plate, picks strip) and the driver reveal |
| `src/hub` | Career hub pieces: driver HUD, event poster, championship and team panels, thumb-zone action dock, driver file |
| `src/ui` | The design system: tokens (`theme.ts`), the kit (plates, meters, position and number plates, tabs, sheets, backdrop), the machined spin wheel |
| `src/state` | zustand store and saves (device files on native, IndexedDB with a localStorage fallback on web) |
| `src/app` | Screens (Expo Router) |
| `assets/source` | Editable SVG sources for the app icon, adaptive icon and splash |

The look is one system, "Midnight Motorsport": ink navy and charcoal surfaces, warm off-white type, signal red for actions and the player, restrained cyan for information and gold only for prestige. Display type is Barlow Condensed, body text Barlow. Plates are skewed like timing graphics, data reads as HUD strips and segmented meters, and decisions arrive as bottom sheets in the thumb zone. Screens are laid out for portrait phones first; on wide web windows the game runs as a phone-width column.

The simulation is deterministic: everything is derived from the world seed plus choices, so a bug report can be reproduced from a save file. The whole universe (all careers, the Archive and the world history) is one save that grows with each career, about 1–3 MB after many decades.

## Adding content

Content lives in data files and small registries, so new material plugs in without changes to the game code.

| To add… | Do this |
| --- | --- |
| A circuit | Add a `TrackDef` to `src/content/tracks.ts`: control points of the racing line in a 1000×1000 box, corner names, environment, overtaking, rain and danger. Put it on a calendar (or in a `rotation`) in `src/content/series.ts`. |
| A team | Add a row to `src/content/teams.ts`: name, colours, livery, performance, budget and principal. The world generator staffs it automatically. |
| A championship | Add a `SeriesDef` to `src/content/series.ts` (tier, prestige, car class, points, calendar, rating band, ages, salaries), plus teams for it. Link it into the ladder with `promotesTo` and the eligibility rules in `src/sim/market.ts`. |
| A livery | Add a pattern to `LIVERIES` in `src/art/liveries.tsx` (shapes in unit space using the team's colour slots). Teams reference it by id. |
| A helmet design | Add the id to `HELMET_PATTERNS` in `src/content/looks.ts` and draw it in `src/art/Helmet.tsx`. |
| A car class | Add side (`SIDE_DEFS`) and top (`TOP_DEFS`) definitions in `src/art/Car.tsx`, then set `carClass` on a series. |
| Portrait parts | Add metadata to the part lists in `src/content/looks.ts` and the drawing to `src/art/Portrait.tsx`. |
| A scenery environment | Add an `EnvironmentDef` to `src/content/environments.ts` (sky, backdrop type, ground, props, kerbs, barrier) and reference it from circuits. |
| A life event | Add a `LifeEventDef` to `src/content/events.ts`: text with placeholders, options, weighted outcomes with effects, and optional conditions. |
| A nation | Add it to `src/content/nations.ts` (flag spec, name group, appearance weights). Name pools are in `src/content/names/`. |
| A UI theme | Colours, fonts, radii and spacing are tokens in `src/ui/theme.ts`. |
| A new app icon | Edit the SVGs in `assets/source/` and export the PNGs in `assets/images/` at the same sizes. |

Record any third-party asset in `ASSET_LICENSES.md` before shipping it.
