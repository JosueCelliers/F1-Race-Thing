import { Platform, useWindowDimensions } from 'react-native';

/**
 * The game is laid out for phones. In a desktop browser it renders as a centred
 * phone-width column instead of stretching across the whole window.
 */
export const WEB_MAX_WIDTH = 520;

/** maxWidth for layout containers (undefined on native: use the whole screen). */
export const appMaxWidth: number | undefined = Platform.OS === 'web' ? WEB_MAX_WIDTH : undefined;

/** Window size, capped to the app column on the web. Use instead of useWindowDimensions. */
export function useScreen(): { width: number; height: number } {
  const { width, height } = useWindowDimensions();
  return { width: Platform.OS === 'web' ? Math.min(width, WEB_MAX_WIDTH) : width, height };
}
