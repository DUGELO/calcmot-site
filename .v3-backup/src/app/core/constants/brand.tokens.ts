export const BRAND_TOKENS = {
  colors: {
    background: '#04060A',
    surface: '#0B1016',
    surfaceElevated: '#101720',
    primary: '#1768F9',
    brandGreen: '#61E329',
    great: '#9C2A9A',
    textPrimary: '#F7F7F7',
    textSecondary: '#B9BBC2',
    textMuted: '#8E929B',
  },
  links: {
    playStore: 'https://play.google.com/store/apps/details?id=br.com.calcmot',
  },
  assets: {
    // Optional real screenshot. If the file is absent, PhoneMockup keeps the CSS fallback.
    overlayScreenshot: '/assets/screenshots/overlay-real.png',
    // Keep null until a dedicated, approved social image exists and its public absolute URL is known.
    ogImage: null as string | null,
  },
} as const;
