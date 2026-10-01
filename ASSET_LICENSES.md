# Asset licences

Chequered Lives uses as few third-party assets as possible. Everything you see in the game is original work made for this project: cars, liveries, helmets, driver portraits, flags, track layouts, scenery, highlight scenes, icons, badges, trophies, the app icon and the splash screen. It is drawn in code as vector graphics (SVG through `react-native-svg`) or exported from the SVG sources in `assets/source/`.

Nothing comes from other games, Formula 1, the FIA, the 24 Hours of Le Mans / WEC, IndyCar, real teams, real sponsors, real circuits or any other brand. Teams, sponsors, series, events, circuits and drivers are all fictional. The name pools leave out famous drivers' distinctive surnames, and the generator re-rolls any full name that matches a famous real driver (`src/content/names.ts`).

**Rule for contributors:** when you add, replace or remove a third-party asset, update the table below in the same change. Don't add an asset unless its licence allows use in a commercial mobile game and you have recorded its source URL, author and licence here.

## Third-party assets

| Asset | Files | Author | Source | Licence | Modifications |
| --- | --- | --- | --- | --- | --- |
| Barlow typeface: Regular, Medium, SemiBold, Bold | `assets/fonts/Barlow_400Regular.ttf`, `Barlow_500Medium.ttf`, `Barlow_600SemiBold.ttf`, `Barlow_700Bold.ttf` | Jeremy Tribby / The Barlow Project Authors | https://github.com/jpt/barlow, distributed via Google Fonts (https://fonts.google.com/specimen/Barlow) and packaged by `@expo-google-fonts/barlow` 0.4.1 | SIL Open Font License 1.1, full text in `assets/fonts/OFL.txt` | None. The unmodified TTFs are loaded under app-specific family names. |
| Barlow Condensed typeface: SemiBold, Bold, Bold Italic, ExtraBold Italic, Black Italic | `assets/fonts/BarlowCondensed_600SemiBold.ttf`, `BarlowCondensed_700Bold.ttf`, `BarlowCondensed_700Bold_Italic.ttf`, `BarlowCondensed_800ExtraBold_Italic.ttf`, `BarlowCondensed_900Black_Italic.ttf` | Jeremy Tribby / The Barlow Project Authors | https://github.com/jpt/barlow, via Google Fonts (https://fonts.google.com/specimen/Barlow+Condensed) and `@expo-google-fonts/barlow-condensed` 0.4.1 | SIL Open Font License 1.1 (`assets/fonts/OFL.txt`) | None. |

What the OFL means here: the fonts can be bundled with and embedded in a commercial app. They cannot be sold on their own. The copyright notice and licence must travel with them; this is covered by `assets/fonts/OFL.txt` and the credit in Settings → About.

### System emoji

Some UI text (life events, records, trophy cabinet) contains standard Unicode emoji characters. The device draws them with its own system emoji font: Apple Color Emoji on iOS, Noto Color Emoji on Android, the operating system's font on the web. No emoji image files are bundled with the app.

### Assets bundled by the framework

These ship in the app binary because dependencies include them. The game's own screens don't use them.

| Asset | Pulled in by | Author | Source | Licence |
| --- | --- | --- | --- | --- |
| Material Symbols icon font (`MaterialSymbols_400Regular.ttf`, ~1 MB) | `expo-router` → `expo-symbols` → `@expo-google-fonts/material-symbols` 0.4.48 (Android symbol rendering) | Google | https://github.com/google/material-design-icons, https://fonts.google.com/icons | Apache License 2.0 (`node_modules/@expo-google-fonts/material-symbols/LICENSE_FONT`) |
| Navigation and fallback-screen icons (`arrow_down.png`, `back-icon.png`, `unmatched.png`, …) | `expo-router` 57 (includes React Navigation elements) | Expo / React Navigation contributors | https://github.com/expo/expo | MIT |

These are credited in Settings → Open-source licences. Before a store release, also bundle the full licence texts. A licence-report tool run over `node_modules` works for this.

## Original assets (made for this project)

| Asset | Location | Notes |
| --- | --- | --- |
| App icon, Android adaptive icon (foreground, background, monochrome), splash image, web favicon | `assets/images/*.png`; editable sources in `assets/source/*.svg` | Original spin-wheel design with a chequered hub. The PNGs are 1:1 renders of the SVG sources. The splash wordmark uses Barlow Condensed (OFL). |
| Cars: side and top views for formula, junior formula, American open-wheel, prototype and GT | `src/art/Car.tsx` | Original vector art. |
| Liveries (8 patterns) | `src/art/liveries.tsx` | Original. Colours come from the fictional teams. |
| Helmets (10 designs) | `src/art/Helmet.tsx`, `src/content/looks.ts` | Original. |
| Driver portraits (modular parts library) | `src/art/Portrait.tsx` | Original. |
| Flags | `src/art/Flag.tsx` | Simplified original drawings of national flags. |
| Circuits (33 fictional layouts) and track maps | `src/content/tracks.ts`, `src/art/TrackMap.tsx`, `src/sim/trackGeometry.ts` | Invented layouts and names. |
| Scenery, particles, highlight scenes | `src/highlights/*` | Original. |
| UI icon set | `src/ui/Icon.tsx` | Original. |
| Team badges, trophies, chequered mark | `src/art/Badges.tsx` | Original. |
| Names of teams, sponsors, series, events, principals and drivers | `src/content/*` | Fictional. Formula 1 appears only as "Formula Prime" and Le Mans / WEC as "24 Hours of France". |

## Code dependencies

The npm packages listed in `package.json` (Expo, React Native, Reanimated, react-native-svg, zustand and others) are open source under MIT, BSD or Apache-2.0 licences. Their licence files ship inside each package. Apart from the framework-bundled assets listed above, the game uses no images, sounds or fonts from them.
