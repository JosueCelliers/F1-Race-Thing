import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Original line-icon set (24px grid, 2px rounded strokes). Drawn in-house so
 * every icon matches the art direction and carries no third-party licence.
 */
export type IconName =
  | 'home'
  | 'back'
  | 'close'
  | 'settings'
  | 'trophy'
  | 'flag'
  | 'archive'
  | 'globe'
  | 'play'
  | 'pause'
  | 'ff'
  | 'skip'
  | 'rain'
  | 'sun'
  | 'cloud'
  | 'tyre'
  | 'wrench'
  | 'star'
  | 'fans'
  | 'money'
  | 'helmet'
  | 'chart'
  | 'calendar'
  | 'dice'
  | 'check'
  | 'lock'
  | 'info'
  | 'sound'
  | 'mute'
  | 'bolt'
  | 'fire'
  | 'shield'
  | 'chevron'
  | 'down'
  | 'refresh'
  | 'edit'
  | 'medal'
  | 'podium'
  | 'clock'
  | 'heart'
  | 'swap'
  | 'crown'
  | 'user'
  | 'list'
  | 'film'
  | 'moon'
  | 'vibrate';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

export function Icon({ name, size = 22, color = '#fff', strokeWidth = 2, fill = 'none' }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const solid = { fill: color, stroke: 'none' };
  let body: React.ReactNode;
  switch (name) {
    case 'home':
      body = (
        <>
          <Path d="M3 11l9-7 9 7" {...p} />
          <Path d="M5 10v10h5v-6h4v6h5V10" {...p} />
        </>
      );
      break;
    case 'back':
      body = <Path d="M15 5l-7 7 7 7" {...p} />;
      break;
    case 'chevron':
      body = <Path d="M9 5l7 7-7 7" {...p} />;
      break;
    case 'down':
      body = <Path d="M5 9l7 7 7-7" {...p} />;
      break;
    case 'close':
      body = <Path d="M6 6l12 12M18 6L6 18" {...p} />;
      break;
    case 'settings':
      body = (
        <>
          <Circle cx="12" cy="12" r="3.2" {...p} />
          <Path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" {...p} />
        </>
      );
      break;
    case 'trophy':
      body = (
        <>
          <Path d="M7 4h10v5a5 5 0 01-10 0V4z" {...p} />
          <Path d="M7 6H4v1.5A3.5 3.5 0 007.5 11M17 6h3v1.5A3.5 3.5 0 0116.5 11M12 14v4M8 20h8" {...p} />
        </>
      );
      break;
    case 'crown':
      body = <Path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8z" {...p} />;
      break;
    case 'flag':
      body = (
        <>
          <Path d="M5 21V4" {...p} />
          <Path d="M5 4h14v10H5" {...p} />
          <Path d="M5 4h3.5v3.3H5zM12 4h3.5v3.3H12zM8.5 7.3H12v3.4H8.5zM15.5 7.3H19v3.4h-3.5zM5 10.7h3.5V14H5zM12 10.7h3.5V14H12z" {...solid} />
        </>
      );
      break;
    case 'archive':
      body = (
        <>
          <Rect x="3" y="4" width="18" height="5" rx="1.5" {...p} />
          <Path d="M5 9v10h14V9M10 13h4" {...p} />
        </>
      );
      break;
    case 'globe':
      body = (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" {...p} />
        </>
      );
      break;
    case 'play':
      body = <Path d="M7 4.5v15l12.5-7.5L7 4.5z" {...solid} />;
      break;
    case 'pause':
      body = (
        <>
          <Rect x="6" y="5" width="4" height="14" rx="1" {...solid} />
          <Rect x="14" y="5" width="4" height="14" rx="1" {...solid} />
        </>
      );
      break;
    case 'ff':
      body = <Path d="M3 6v12l8-6-8-6zM12 6v12l8-6-8-6z" {...solid} />;
      break;
    case 'skip':
      body = (
        <>
          <Path d="M4 6v12l9-6-9-6z" {...solid} />
          <Rect x="15" y="6" width="3.5" height="12" rx="1" {...solid} />
        </>
      );
      break;
    case 'rain':
      body = (
        <>
          <Path d="M7 15a4 4 0 01-.4-8A5.5 5.5 0 0117 8.5 3.5 3.5 0 0117 15H7z" {...p} />
          <Path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" {...p} />
        </>
      );
      break;
    case 'cloud':
      body = <Path d="M7 18a4.5 4.5 0 01-.5-9A6 6 0 0118 10a4 4 0 010 8H7z" {...p} />;
      break;
    case 'sun':
      body = (
        <>
          <Circle cx="12" cy="12" r="4" {...p} />
          <Path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" {...p} />
        </>
      );
      break;
    case 'moon':
      body = <Path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" {...p} />;
      break;
    case 'tyre':
      body = (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Circle cx="12" cy="12" r="4" {...p} />
          <Path d="M12 3v5M12 16v5M3 12h5M16 12h5" {...p} strokeWidth={strokeWidth * 0.8} />
        </>
      );
      break;
    case 'wrench':
      body = <Path d="M14.5 5.5a4.5 4.5 0 00-5.7 5.7L3.5 16.5 7.5 20.5l5.3-5.3a4.5 4.5 0 005.7-5.7l-2.8 2.8-2.9-.7-.7-2.9 2.4-3.2z" {...p} />;
      break;
    case 'star':
      body = <Path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8L12 3.5z" {...(fill !== 'none' ? { fill, stroke: color, strokeWidth, strokeLinejoin: 'round' as const } : p)} />;
      break;
    case 'fans':
      body = (
        <>
          <Circle cx="9" cy="8" r="3.2" {...p} />
          <Path d="M3 19c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5" {...p} />
          <Circle cx="17" cy="9" r="2.5" {...p} />
          <Path d="M16.5 13.6c2.5.2 4 1.9 4.5 4.4" {...p} />
        </>
      );
      break;
    case 'user':
      body = (
        <>
          <Circle cx="12" cy="8" r="4" {...p} />
          <Path d="M4 20c.8-4 4-6 8-6s7.2 2 8 6" {...p} />
        </>
      );
      break;
    case 'money':
      body = (
        <>
          <Rect x="2.5" y="6" width="19" height="12" rx="2" {...p} />
          <Circle cx="12" cy="12" r="2.8" {...p} />
          <Path d="M6 9v6M18 9v6" {...p} />
        </>
      );
      break;
    case 'helmet':
      body = (
        <>
          <Path d="M3.5 14.5C3.5 8.5 7.5 4.5 13 4.5c4.5 0 7.5 3.3 7.5 7.8V17a2 2 0 01-2 2H7a3.5 3.5 0 01-3.5-3.5v-1z" {...p} />
          <Path d="M11 10.5h9.5v3.8H12a1 1 0 01-1-1v-2.8z" {...p} />
        </>
      );
      break;
    case 'chart':
      body = <Path d="M4 20V10M10 20V4M16 20v-8M22 20H2" {...p} />;
      break;
    case 'calendar':
      body = (
        <>
          <Rect x="3.5" y="5" width="17" height="15" rx="2" {...p} />
          <Path d="M3.5 10h17M8 3v4M16 3v4" {...p} />
        </>
      );
      break;
    case 'clock':
      body = (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 7v5l3 2" {...p} />
        </>
      );
      break;
    case 'dice':
      body = (
        <>
          <Rect x="4" y="4" width="16" height="16" rx="3" {...p} />
          <Circle cx="8.5" cy="8.5" r="1.3" {...solid} />
          <Circle cx="15.5" cy="15.5" r="1.3" {...solid} />
          <Circle cx="12" cy="12" r="1.3" {...solid} />
          <Circle cx="15.5" cy="8.5" r="1.3" {...solid} />
          <Circle cx="8.5" cy="15.5" r="1.3" {...solid} />
        </>
      );
      break;
    case 'check':
      body = <Path d="M4.5 12.5l4.5 4.5L19.5 6.5" {...p} />;
      break;
    case 'lock':
      body = (
        <>
          <Rect x="5" y="10.5" width="14" height="10" rx="2" {...p} />
          <Path d="M8 10.5V8a4 4 0 018 0v2.5" {...p} />
        </>
      );
      break;
    case 'info':
      body = (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 11v6" {...p} />
          <Circle cx="12" cy="7.5" r="1.2" {...solid} />
        </>
      );
      break;
    case 'sound':
      body = (
        <>
          <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z" {...p} />
          <Path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" {...p} />
        </>
      );
      break;
    case 'mute':
      body = (
        <>
          <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4v-5z" {...p} />
          <Path d="M16 9.5l5 5M21 9.5l-5 5" {...p} />
        </>
      );
      break;
    case 'vibrate':
      body = (
        <>
          <Rect x="7.5" y="3.5" width="9" height="17" rx="2" {...p} />
          <Path d="M3.5 9v6M20.5 9v6" {...p} />
        </>
      );
      break;
    case 'bolt':
      body = <Path d="M13 2.5L5 13.5h6l-1 8 8-11h-6l1-8z" {...p} />;
      break;
    case 'fire':
      body = <Path d="M12 21c-4 0-7-2.7-7-6.5 0-3 2-5 3.5-6.5.3 2 1.3 3 2.5 3.5C10.5 8 11.5 5 14 3c0 3 5 5.5 5 11.5 0 3.8-3 6.5-7 6.5z" {...p} />;
      break;
    case 'shield':
      body = <Path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6L12 3z" {...p} />;
      break;
    case 'refresh':
      body = (
        <>
          <Path d="M20 11a8 8 0 00-14.3-4.5L4 8.5" {...p} />
          <Path d="M4 4v4.5h4.5M4 13a8 8 0 0014.3 4.5l1.7-2" {...p} />
          <Path d="M20 20v-4.5h-4.5" {...p} />
        </>
      );
      break;
    case 'edit':
      body = <Path d="M4 20h4l11-11-4-4L4 16v4zM13.5 6.5l4 4" {...p} />;
      break;
    case 'medal':
      body = (
        <>
          <Path d="M8 3l4 6 4-6M6 3h4M14 3h4" {...p} />
          <Circle cx="12" cy="15" r="5.5" {...p} />
          <Path d="M12 12.5v5" {...p} />
        </>
      );
      break;
    case 'podium':
      body = <Path d="M2.5 20.5h19M9 20.5v-11h6v11M3 20.5V14h6M15 20.5v-8h6v8" {...p} />;
      break;
    case 'heart':
      body = <Path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0112 7a4.5 4.5 0 017.5 3c0 5.4-7.5 10-7.5 10z" {...p} />;
      break;
    case 'swap':
      body = <Path d="M7 4L3.5 7.5 7 11M3.5 7.5h13M17 13l3.5 3.5L17 20M20.5 16.5h-13" {...p} />;
      break;
    case 'list':
      body = <Path d="M8 6h13M8 12h13M8 18h13M3.5 6h.5M3.5 12h.5M3.5 18h.5" {...p} />;
      break;
    case 'film':
      body = (
        <>
          <Rect x="3" y="4" width="18" height="16" rx="2" {...p} />
          <Path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" {...p} />
        </>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
