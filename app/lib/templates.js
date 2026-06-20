export const baseConfig = {
  colors: {
    background: '#ffffff',
    cardBackground: '#f9fafb',
    primaryText: '#111827',
    secondaryText: '#6b7280',
    accent: '#f97316',
    border: '#e5e7eb',
    tabActive: '#f97316',
    tabActiveText: '#ffffff',
    tabInactive: '#f3f4f6',
    tabInactiveText: '#6b7280',
    price: '#f97316',
    badge: '#f97316',
    header: '#ffffff',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    headingSize: 24,
    bodySize: 14,
    headingWeight: '700',
    bodyWeight: '400',
    letterSpacing: 0,
    lineHeight: 1.6,
  },
  layout: {
    cardStyle: 'grid-2',
    showImage: true,
    imagePosition: 'top',
    imageRadius: 8,
    cardRadius: 12,
    cardPadding: 16,
    cardShadow: 'md',
    tabStyle: 'pills',
    tabPosition: 'top',
    showDescription: true,
    showCalories: false,
    showBadges: true,
    currency: '$',
    showCurrency: true,
    headerStyle: 'logo-banner',
    bannerHeight: 180,
  },
  badges: {
    showNew: true,
    newLabel: 'New',
    newColor: '#22c55e',
    showPopular: true,
    popularLabel: 'Popular',
    popularColor: '#f97316',
    showSpicy: true,
    spicyLabel: '🌶️ Spicy',
    spicyColor: '#ef4444',
    showVegan: true,
    veganLabel: '🌱 Vegan',
    veganColor: '#22c55e',
    showHalal: true,
    halalLabel: '✓ Halal',
    halalColor: '#16a34a',
  }
};

export const templates = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🍽️',
    colors: { ...baseConfig.colors },
    fonts: { ...baseConfig.fonts },
    layout: { ...baseConfig.layout },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    emoji: '🖤',
    colors: {
      ...baseConfig.colors,
      background: '#0a0a0a',
      cardBackground: '#1a1a1a',
      primaryText: '#ffffff',
      secondaryText: '#9ca3af',
      accent: '#d4af37',
      border: '#2a2a2a',
      tabActive: '#d4af37',
      tabActiveText: '#0a0a0a',
      tabInactive: '#1f1f1f',
      tabInactiveText: '#9ca3af',
      price: '#d4af37',
      badge: '#d4af37',
      header: '#1a1a1a'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Playfair Display',
      body: 'Inter'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 16,
      cardShadow: 'lg',
      tabStyle: 'underline'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '⬜',
    colors: {
      ...baseConfig.colors,
      background: '#fafafa',
      cardBackground: '#ffffff',
      primaryText: '#000000',
      secondaryText: '#737373',
      accent: '#000000',
      border: '#f0f0f0',
      tabActive: '#000000',
      tabActiveText: '#ffffff',
      tabInactive: '#f5f5f5',
      tabInactiveText: '#737373',
      price: '#000000',
      badge: '#000000',
      header: '#ffffff'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'DM Sans',
      body: 'DM Sans'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 4,
      cardShadow: 'none',
      tabStyle: 'minimal'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'cafe',
    name: 'Café',
    emoji: '☕',
    colors: {
      ...baseConfig.colors,
      background: '#fdf6e3',
      cardBackground: '#fffbf0',
      primaryText: '#3d2b1f',
      secondaryText: '#7c5c4a',
      accent: '#a26b43',
      border: '#e8d5b7',
      tabActive: '#a26b43',
      tabActiveText: '#ffffff',
      tabInactive: '#f0e6d2',
      tabInactiveText: '#7c5c4a',
      price: '#a26b43',
      badge: '#a26b43',
      header: '#fffbf0'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Lora',
      body: 'Lora'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 8,
      tabStyle: 'pills',
      imagePosition: 'left'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    emoji: '🌙',
    colors: {
      ...baseConfig.colors,
      background: '#0f172a',
      cardBackground: '#1e293b',
      primaryText: '#f1f5f9',
      secondaryText: '#94a3b8',
      accent: '#f97316',
      border: '#334155',
      tabActive: '#f97316',
      tabActiveText: '#ffffff',
      tabInactive: '#1e293b',
      tabInactiveText: '#94a3b8',
      price: '#f97316',
      badge: '#f97316',
      header: '#1e293b'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Poppins',
      body: 'Poppins'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 16,
      cardShadow: 'lg',
      tabStyle: 'pills'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    emoji: '🌈',
    colors: {
      ...baseConfig.colors,
      background: '#fafafa',
      cardBackground: '#ffffff',
      primaryText: '#1a1a1a',
      secondaryText: '#555555',
      accent: '#ec4899',
      border: '#e5e5e5',
      tabActive: '#ec4899',
      tabActiveText: '#ffffff',
      tabInactive: '#f0f0f0',
      tabInactiveText: '#555555',
      price: '#ec4899',
      badge: '#ec4899',
      header: '#ffffff'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Nunito',
      body: 'Nunito'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 20,
      tabStyle: 'pills'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'fine-dining',
    name: 'Fine Dining',
    emoji: '🥂',
    colors: {
      ...baseConfig.colors,
      background: '#1a1a1a',
      cardBackground: '#242424',
      primaryText: '#f5f0e8',
      secondaryText: '#c9b99a',
      accent: '#c9b99a',
      border: '#333333',
      tabActive: '#c9b99a',
      tabActiveText: '#1a1a1a',
      tabInactive: '#2d2d2d',
      tabInactiveText: '#c9b99a',
      price: '#c9b99a',
      badge: '#c9b99a',
      header: '#242424'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Cormorant Garamond',
      body: 'Cormorant Garamond'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 0,
      cardShadow: 'none',
      tabStyle: 'underline'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'street-food',
    name: 'Street Food',
    emoji: '🌮',
    colors: {
      ...baseConfig.colors,
      background: '#1a1a2e',
      cardBackground: '#16213e',
      primaryText: '#ffffff',
      secondaryText: '#a0a0b0',
      accent: '#ff4757',
      border: '#0f3460',
      tabActive: '#ff4757',
      tabActiveText: '#ffffff',
      tabInactive: '#0f3460',
      tabInactiveText: '#a0a0b0',
      price: '#ff4757',
      badge: '#ff4757',
      header: '#16213e'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Bebas Neue',
      body: 'Inter'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 8,
      tabStyle: 'boxed'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    emoji: '🌊',
    colors: {
      ...baseConfig.colors,
      background: '#f0f7ff',
      cardBackground: '#ffffff',
      primaryText: '#1e3a5f',
      secondaryText: '#4a6fa5',
      accent: '#3b82f6',
      border: '#bdd7f5',
      tabActive: '#3b82f6',
      tabActiveText: '#ffffff',
      tabInactive: '#e0f2fe',
      tabInactiveText: '#4a6fa5',
      price: '#3b82f6',
      badge: '#3b82f6',
      header: '#ffffff'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Raleway',
      body: 'Raleway'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 12,
      tabStyle: 'pills'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'japanese',
    name: 'Japanese',
    emoji: '🍱',
    colors: {
      ...baseConfig.colors,
      background: '#fafaf8',
      cardBackground: '#ffffff',
      primaryText: '#1a1a1a',
      secondaryText: '#666666',
      accent: '#b61c1c',
      border: '#e8e8e0',
      tabActive: '#b61c1c',
      tabActiveText: '#ffffff',
      tabInactive: '#f0f0eb',
      tabInactiveText: '#666666',
      price: '#b61c1c',
      badge: '#b61c1c',
      header: '#ffffff'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Noto Serif',
      body: 'Noto Serif'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 2,
      cardShadow: 'none',
      tabStyle: 'minimal'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'arabic',
    name: 'Arabic Traditional',
    emoji: '🕌',
    colors: {
      ...baseConfig.colors,
      background: '#fdfaf2',
      cardBackground: '#ffffff',
      primaryText: '#2c1a04',
      secondaryText: '#6d5438',
      accent: '#d97706',
      border: '#f0e6d2',
      tabActive: '#d97706',
      tabActiveText: '#ffffff',
      tabInactive: '#f5ebd6',
      tabInactiveText: '#6d5438',
      price: '#d97706',
      badge: '#d97706',
      header: '#ffffff'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Cairo',
      body: 'Cairo'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 8,
      tabStyle: 'pills'
    },
    badges: { ...baseConfig.badges }
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    emoji: '⚡',
    colors: {
      ...baseConfig.colors,
      background: '#000000',
      cardBackground: '#0c0c0c',
      primaryText: '#ffffff',
      secondaryText: '#888888',
      accent: '#22c55e',
      border: '#222222',
      tabActive: '#22c55e',
      tabActiveText: '#000000',
      tabInactive: '#111111',
      tabInactiveText: '#888888',
      price: '#22c55e',
      badge: '#22c55e',
      header: '#0c0c0c'
    },
    fonts: {
      ...baseConfig.fonts,
      heading: 'Inter',
      body: 'Inter'
    },
    layout: {
      ...baseConfig.layout,
      cardRadius: 12,
      tabStyle: 'pills'
    },
    badges: { ...baseConfig.badges }
  }
];

export const googleFontsList = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Raleway",
  "Lato",
  "Playfair Display",
  "Cormorant Garamond",
  "Lora",
  "DM Sans",
  "Nunito",
  "Josefin Sans",
  "Oswald",
  "Bebas Neue",
  "Merriweather",
  "Cairo",
  "Tajawal",
  "Noto Serif",
  "Source Sans Pro",
  "Roboto",
  "Open Sans"
];

export function getTemplateDefaults(templateId) {
  const preset = templates.find((t) => t.id === templateId) || templates[0];
  return {
    colors: { ...preset.colors },
    fonts: { ...preset.fonts },
    layout: { ...preset.layout },
    badges: { ...preset.badges }
  };
}

export function generateCssStyles(cust) {
  if (!cust) return "";

  const colors = cust.colors || baseConfig.colors;
  const fonts = cust.fonts || baseConfig.fonts;
  const layout = cust.layout || baseConfig.layout;
  const badges = cust.badges || baseConfig.badges;

  const cardBorderColor = layout.cardShadow === 'none' ? colors.border : 'transparent';
  
  // Resolve tab active/inactive selectors
  let tabStyles = "";
  if (layout.tabStyle === 'pills') {
    tabStyles = `
      .custom-category-tab-active {
        background-color: var(--color-tab-active) !important;
        color: var(--color-tab-active-text) !important;
        border-radius: 9999px !important;
      }
      .custom-category-tab-inactive {
        background-color: var(--color-tab-inactive) !important;
        color: var(--color-tab-inactive-text) !important;
        border-radius: 9999px !important;
      }
    `;
  } else if (layout.tabStyle === 'underline') {
    tabStyles = `
      .custom-category-tab-active {
        background-color: transparent !important;
        color: var(--color-accent) !important;
        border-bottom: 3px solid var(--color-accent) !important;
        border-radius: 0px !important;
      }
      .custom-category-tab-inactive {
        background-color: transparent !important;
        color: var(--color-text-secondary) !important;
        border-bottom: 3px solid transparent !important;
        border-radius: 0px !important;
      }
    `;
  } else if (layout.tabStyle === 'boxed') {
    tabStyles = `
      .custom-category-tab-active {
        background-color: var(--color-tab-active) !important;
        color: var(--color-tab-active-text) !important;
        border-radius: 8px !important;
      }
      .custom-category-tab-inactive {
        background-color: var(--color-tab-inactive) !important;
        color: var(--color-tab-inactive-text) !important;
        border-radius: 8px !important;
        border: 1px solid var(--color-border) !important;
      }
    `;
  } else { // minimal
    tabStyles = `
      .custom-category-tab-active {
        background-color: transparent !important;
        color: var(--color-accent) !important;
        border-radius: 0px !important;
        font-weight: 800 !important;
      }
      .custom-category-tab-inactive {
        background-color: transparent !important;
        color: var(--color-text-secondary) !important;
        border-radius: 0px !important;
      }
    `;
  }

  // Resolve shadow selection class
  let shadowClass = 'none';
  if (layout.cardShadow === 'sm') shadowClass = '0 1px 2px 0 rgba(0,0,0,0.05)';
  else if (layout.cardShadow === 'md') shadowClass = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
  else if (layout.cardShadow === 'lg') shadowClass = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
  else if (layout.cardShadow === 'xl') shadowClass = '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)';

  return `
    :root {
      /* Advanced Customizer variables */
      --color-bg: ${colors.background};
      --color-card-bg: ${colors.cardBackground};
      --color-text: ${colors.primaryText};
      --color-text-secondary: ${colors.secondaryText};
      --color-accent: ${colors.accent};
      --color-border: ${colors.border};
      --color-tab-active: ${colors.tabActive};
      --color-tab-active-text: ${colors.tabActiveText};
      --color-tab-inactive: ${colors.tabInactive};
      --color-tab-inactive-text: ${colors.tabInactiveText};
      --color-price: ${colors.price};
      --color-badge: ${colors.badge};
      --color-header: ${colors.header};

      --font-heading: "${fonts.heading}", sans-serif;
      --font-body: "${fonts.body}", sans-serif;
      --font-heading-size: ${fonts.headingSize}px;
      --font-body-size: ${fonts.bodySize}px;
      --font-heading-weight: ${fonts.headingWeight || "700"};
      --font-body-weight: ${fonts.bodyWeight || "400"};
      --letter-spacing: ${fonts.letterSpacing}px;
      --line-height: ${fonts.lineHeight || "1.6"};

      --card-radius: ${layout.cardRadius}px;
      --card-padding: ${layout.cardPadding}px;
      --card-shadow: ${shadowClass};
      --image-radius: ${layout.imageRadius}px;
      --banner-height: ${layout.bannerHeight}px;

      /* Backwards compatible menu-client.jsx bindings */
      --menu-bg: ${colors.background};
      --menu-sec-bg: ${colors.background};
      --menu-card-bg: ${colors.cardBackground};
      --menu-text-primary: ${colors.primaryText};
      --menu-text-sec: ${colors.secondaryText};
      --menu-accent: ${colors.accent};
      --menu-tab-active: ${colors.tabActive};
      --menu-tab-inactive: ${colors.tabInactive};
      --menu-btn: ${colors.accent};
      --menu-border: ${colors.border};
      --menu-card-border-color: ${cardBorderColor};

      --menu-font-heading: "${fonts.heading}", sans-serif;
      --menu-font-body: "${fonts.body}", sans-serif;
      --menu-heading-size: ${fonts.headingSize}px;
      --menu-body-size: ${fonts.bodySize}px;
      --menu-font-weight: ${fonts.headingWeight || "700"};
      --menu-letter-spacing: ${fonts.letterSpacing}px;
      --menu-line-height: ${fonts.lineHeight || "1.6"};

      --menu-card-padding: ${layout.cardPadding}px;
      --menu-card-radius: ${layout.cardRadius}px;
      --menu-img-radius: ${layout.imageRadius}px;
      --menu-card-shadow: ${shadowClass};
      --menu-border-style: ${layout.cardShadow === 'none' ? 'solid' : 'none'};
    }

    .tarapeza-public-menu {
      background-color: var(--color-bg) !important;
      color: var(--color-text) !important;
      font-family: var(--font-body), sans-serif !important;
      line-height: var(--line-height) !important;
    }

    .tarapeza-public-menu h1,
    .tarapeza-public-menu h2,
    .tarapeza-public-menu h3,
    .tarapeza-public-menu h4,
    .tarapeza-public-menu h5 {
      font-family: var(--font-heading), sans-serif !important;
      font-weight: var(--font-heading-weight) !important;
      letter-spacing: var(--letter-spacing) !important;
    }

    .custom-menu-card {
      background-color: var(--color-card-bg) !important;
      border: 1px solid var(--color-border) !important;
      border-radius: var(--card-radius) !important;
      padding: var(--card-padding) !important;
      box-shadow: var(--card-shadow) !important;
      transition: all 0.2s ease-in-out;
    }

    .custom-menu-card:hover {
      border-color: var(--color-accent) !important;
    }

    .custom-menu-btn {
      background-color: var(--color-accent) !important;
      color: var(--color-tab-active-text) !important;
    }

    ${tabStyles}
    ${cust.customCss || ""}
  `;
}
