# Chequered Lives

*Spin a driver. Live the career. Build a legacy.*

A mobile racing-career game for **iOS and Android** (React Native + Expo). Spin a series of wheels to create a racing driver — nationality, family, debut age, pace, racecraft, wet-weather skill, personality, potential, first championship and team — then live their whole career in a persistent, connected motorsport universe:

- **Formula Cadet → Contender → Apex → Formula Prime** open-wheel ladder
- **Global Endurance Championship** with the **24 Hours of France**
- **American Open-Wheel Championship** with the **Heartland 500**
- **GT World Series** with the **Kurrajong 1000**

Watch races on a 2D broadcast map, make the calls that matter (send it, defend, pit under the safety car, gamble on slicks in the rain, obey or ignore team orders) and relive the big moments as animated 2D highlights. When the career ends, it's sealed in **The Archive** — Legends, Champions, Cult Heroes and Disasters — and the world moves on: your old rivals keep racing, your records stand, and your next driver might even be your last driver's kid.

All series, teams, sponsors, tracks and people are fictional.

> Work in progress — see `ASSET_LICENSES.md` for third-party assets.

## Run it

```bash
npm install
npx expo start          # scan the QR code with Expo Go (iOS / Android)
npx expo start --web    # quick preview in a browser
```

## Develop

```bash
npm run typecheck       # TypeScript
npm test                # simulation unit tests (vitest)
npm run sim -- 6 1234   # headless: build a world and auto-play 6 careers
```

Code map:

| Folder | What lives there |
| --- | --- |
| `src/content` | Data: nations, names, series, teams, tracks, life events, portrait parts |
| `src/sim` | Pure TypeScript game simulation (no React): world, market, race engine, careers |
| `src/art` | Original vector art: portraits, helmets, cars + liveries, flags, track maps |
| `src/highlights` | 2D cinematic highlight scenes and effects |
| `src/race` | Race broadcast view components |
| `src/ui` | Design system and shared components |
| `src/app` | Screens (Expo Router) |
