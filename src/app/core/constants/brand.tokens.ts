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
    instagram: 'https://www.instagram.com/calcmot',
  },
  site: {
    name: 'CalcMot',
    locale: 'pt_BR',
    // Production canonical URL; www is an alias of this hostname.
    url: 'https://calcmot.com.br',
    // The Play listing publishes a personal support email. Keep this empty to
    // point the support page to the Play listing instead of exposing personal
    // contact data on the site. Fill it only with an authorised address.
    supportEmail: '',
  },
  assets: {
    // Real, approved app captures. The files are JPEG.
    overlayLive: '/assets/screenshots/offer-uber-live-cropped.jpg',
    overlayReal: '/assets/screenshots/overlay-real-cropped.jpg',
    settings: '/assets/screenshots/app-settings.jpg',
    // Keep null until a dedicated, approved social image exists and its public absolute URL is known.
    ogImage: null as string | null,
  },
} as const;
