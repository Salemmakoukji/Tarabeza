export const templates = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🍽️',
    bg: '#ffffff',
    cardBg: '#f9fafb',
    text: '#111827',
    secondaryText: '#6b7280',
    border: '#e5e7eb',
    font: 'Inter',
    cardRadius: '12px',
    cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
    tabStyle: 'pills',
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    emoji: '🖤',
    bg: '#0a0a0a',
    cardBg: '#1a1a1a',
    text: '#ffffff',
    secondaryText: '#9ca3af',
    border: '#2a2a2a',
    font: 'Playfair Display',
    cardRadius: '16px',
    cardShadow: '0 4px 20px rgba(0,0,0,0.5)',
    tabStyle: 'underline',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '⬜',
    bg: '#fafafa',
    cardBg: '#ffffff',
    text: '#000000',
    secondaryText: '#737373',
    border: '#f0f0f0',
    font: 'DM Sans',
    cardRadius: '4px',
    cardShadow: 'none',
    tabStyle: 'minimal',
  },
  {
    id: 'cafe',
    name: 'Café',
    emoji: '☕',
    bg: '#fdf6e3',
    cardBg: '#fffbf0',
    text: '#3d2b1f',
    secondaryText: '#7c5c4a',
    border: '#e8d5b7',
    font: 'Lora',
    cardRadius: '8px',
    cardShadow: '0 2px 8px rgba(61,43,31,0.1)',
    tabStyle: 'pills',
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    emoji: '🌙',
    bg: '#0f172a',
    cardBg: '#1e293b',
    text: '#f1f5f9',
    secondaryText: '#94a3b8',
    border: '#334155',
    font: 'Poppins',
    cardRadius: '16px',
    cardShadow: '0 4px 24px rgba(0,0,0,0.4)',
    tabStyle: 'pills',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    emoji: '🌈',
    bg: '#fafafa',
    cardBg: '#ffffff',
    text: '#1a1a1a',
    secondaryText: '#555555',
    border: '#e5e5e5',
    font: 'Nunito',
    cardRadius: '20px',
    cardShadow: '0 4px 16px rgba(0,0,0,0.08)',
    tabStyle: 'pills',
  },
  {
    id: 'fine-dining',
    name: 'Fine Dining',
    emoji: '🥂',
    bg: '#1a1a1a',
    cardBg: '#242424',
    text: '#f5f0e8',
    secondaryText: '#c9b99a',
    border: '#333333',
    font: 'Cormorant Garamond',
    cardRadius: '0px',
    cardShadow: 'none',
    tabStyle: 'underline',
  },
  {
    id: 'street-food',
    name: 'Street Food',
    emoji: '🌮',
    bg: '#1a1a2e',
    cardBg: '#16213e',
    text: '#ffffff',
    secondaryText: '#a0a0b0',
    border: '#0f3460',
    font: 'Bebas Neue',
    cardRadius: '8px',
    cardShadow: '0 0 20px rgba(0,0,0,0.3)',
    tabStyle: 'boxed',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    emoji: '🌊',
    bg: '#f0f7ff',
    cardBg: '#ffffff',
    text: '#1e3a5f',
    secondaryText: '#4a6fa5',
    border: '#bdd7f5',
    font: 'Raleway',
    cardRadius: '12px',
    cardShadow: '0 2px 12px rgba(30,58,95,0.1)',
    tabStyle: 'pills',
  },
  {
    id: 'japanese',
    name: 'Japanese',
    emoji: '🍱',
    bg: '#fafaf8',
    cardBg: '#ffffff',
    text: '#1a1a1a',
    secondaryText: '#666666',
    border: '#e8e8e0',
    font: 'Noto Serif',
    cardRadius: '2px',
    cardShadow: '0 1px 4px rgba(0,0,0,0.06)',
    tabStyle: 'minimal',
  },
];

export const googleFontsList = [
  "Inter",
  "Playfair Display",
  "DM Sans",
  "Lora",
  "Poppins",
  "Nunito",
  "Cormorant Garamond",
  "Bebas Neue",
  "Raleway",
  "Noto Serif"
];

export function getTemplateDefaults(templateId) {
  const preset = templates.find((t) => t.id === templateId) || templates[0];
  
  // Choose standard structural card configurations matching each preset style
  let cardStyle = 'grid-2col';
  let showImage = true;
  let imagePosition = 'top';
  
  if (preset.id === 'minimal') {
    cardStyle = 'list';
    imagePosition = 'right';
  } else if (preset.id === 'fine-dining') {
    cardStyle = 'list';
    showImage = false;
  } else if (preset.id === 'japanese') {
    cardStyle = 'grid-3col';
  } else if (preset.id === 'cafe') {
    imagePosition = 'left';
  }

  return {
    colors: {
      bg: preset.bg,
      secondaryBg: preset.bg,
      cardBg: preset.cardBg,
      textPrimary: preset.text,
      textSecondary: preset.secondaryText,
      accent: '#f97316', // Overridden dynamically by restaurant's accent_color
      tabActive: '#f97316',
      tabInactive: preset.secondaryText,
      button: '#f97316',
      border: preset.border,
    },
    fonts: {
      heading: preset.font,
      body: preset.font,
      headingSize: '32px',
      bodySize: '16px',
      weight: '700',
      letterSpacing: '0px',
      lineHeight: '1.4',
    },
    layout: {
      cardStyle: cardStyle,
      showImage: showImage,
      imagePosition: imagePosition,
      imageRadius: preset.cardRadius === '0px' ? '0px' : '8px',
      cardPadding: '16px',
      cardRadius: preset.cardRadius,
      shadow: preset.cardShadow === 'none' ? 'none' : 'sm',
      tabsStyle: preset.tabStyle,
      tabsPosition: 'top',
      showDescription: true,
      showCalories: true,
      showCurrency: true,
      currencySymbol: '$',
    },
    icons: {
      style: 'Lucide',
      showNewBadge: true,
      newBadgeColor: '#10B981',
      showPopularBadge: true,
      popularBadgeColor: '#EF4444',
      showSpicyBadge: true,
      spicyBadgeColor: '#F59E0B',
      showVeganBadge: true,
      veganBadgeColor: '#10B981',
      showHalalBadge: true,
      halalBadgeColor: '#059669',
      headerStyle: 'logo+banner',
      bannerHeight: '220px',
    },
    advanced: {
      customCss: '',
      borderStyle: preset.id === 'minimal' ? 'none' : 'solid',
      dividerBetweenCategories: true,
      stickyTabs: true,
      backToTop: true,
      socialMedia: true,
    }
  };
}

export function generateCssStyles(theme) {
  if (!theme || !theme.colors || !theme.fonts || !theme.layout) {
    return "";
  }

  const { colors, fonts, layout, advanced } = theme;
  const cardBorderColor = advanced?.borderStyle === "none" ? "transparent" : colors.border;
  
  // Resolve category tab styles
  let tabStyles = "";
  if (layout.tabsStyle === 'pills') {
    tabStyles = `
      .custom-category-tab-active {
        background-color: var(--menu-accent) !important;
        color: #ffffff !important;
        border-radius: 9999px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
      }
      .custom-category-tab-inactive {
        background-color: transparent !important;
        color: var(--menu-text-sec) !important;
        border: 1px solid var(--menu-border) !important;
        border-radius: 9999px !important;
      }
    `;
  } else if (layout.tabsStyle === 'underline') {
    tabStyles = `
      .custom-category-tab-active {
        background-color: transparent !important;
        color: var(--menu-accent) !important;
        border-bottom: 3px solid var(--menu-accent) !important;
        border-radius: 0px !important;
      }
      .custom-category-tab-inactive {
        background-color: transparent !important;
        color: var(--menu-text-sec) !important;
        border-bottom: 3px solid transparent !important;
        border-radius: 0px !important;
      }
    `;
  } else if (layout.tabsStyle === 'boxed') {
    tabStyles = `
      .custom-category-tab-active {
        background-color: var(--menu-accent) !important;
        color: #ffffff !important;
        border-radius: 8px !important;
      }
      .custom-category-tab-inactive {
        background-color: var(--menu-card-bg) !important;
        color: var(--menu-text-sec) !important;
        border: 1px solid var(--menu-border) !important;
        border-radius: 8px !important;
      }
    `;
  } else { // minimal
    tabStyles = `
      .custom-category-tab-active {
        background-color: transparent !important;
        color: var(--menu-accent) !important;
        border-radius: 0px !important;
        font-weight: 800 !important;
      }
      .custom-category-tab-inactive {
        background-color: transparent !important;
        color: var(--menu-text-sec) !important;
        border-radius: 0px !important;
      }
    `;
  }

  return `
    :root {
      --menu-bg: ${colors.bg};
      --menu-sec-bg: ${colors.secondaryBg};
      --menu-card-bg: ${colors.cardBg};
      --menu-text-primary: ${colors.textPrimary};
      --menu-text-sec: ${colors.textSecondary};
      --menu-accent: ${colors.accent};
      --menu-tab-active: ${colors.tabActive};
      --menu-tab-inactive: ${colors.tabInactive};
      --menu-btn: ${colors.button};
      --menu-border: ${colors.border};
      --menu-card-border-color: ${cardBorderColor};

      --menu-font-heading: "${fonts.heading}", sans-serif;
      --menu-font-body: "${fonts.body}", sans-serif;
      --menu-heading-size: ${fonts.headingSize || "30px"};
      --menu-body-size: ${fonts.bodySize || "15px"};
      --menu-font-weight: ${fonts.weight || "600"};
      --menu-letter-spacing: ${fonts.letterSpacing || "0px"};
      --menu-line-height: ${fonts.lineHeight || "1.5"};

      --menu-card-padding: ${layout.cardPadding || "16px"};
      --menu-card-radius: ${layout.cardRadius || "12px"};
      --menu-img-radius: ${layout.imageRadius || "8px"};
      --menu-card-shadow: ${layout.shadow === 'none' ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'};
      --menu-border-style: ${advanced?.borderStyle || "solid"};
    }

    .tarapeza-public-menu {
      background-color: var(--menu-bg) !important;
      color: var(--menu-text-primary) !important;
      font-family: var(--menu-font-body), sans-serif !important;
    }

    .tarapeza-public-menu h1,
    .tarapeza-public-menu h2,
    .tarapeza-public-menu h3,
    .tarapeza-public-menu h4,
    .tarapeza-public-menu h5 {
      font-family: var(--menu-font-heading), sans-serif !important;
    }

    .custom-menu-card {
      background-color: var(--menu-card-bg) !important;
      border: 1px var(--menu-border-style) var(--menu-card-border-color) !important;
      border-radius: var(--menu-card-radius) !important;
      padding: var(--menu-card-padding) !important;
      box-shadow: var(--menu-card-shadow) !important;
      transition: all 0.2s ease-in-out;
    }

    .custom-menu-card:hover {
      border-color: var(--menu-accent) !important;
    }

    .custom-menu-btn {
      background-color: var(--menu-btn) !important;
      color: #FFFFFF !important;
    }

    ${tabStyles}
  `;
}
