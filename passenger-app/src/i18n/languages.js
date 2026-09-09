// Single config object — adding a 6th language is one entry here + strings.js only.
export const LANGUAGES = {
  en: {
    name: "English",
    nativeName: "English",
    dir: "ltr",
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  hi: {
    name: "Hindi",
    nativeName: "हिंदी",
    dir: "ltr",
    fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
  },
  kn: {
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    dir: "ltr",
    fontFamily: '"Noto Sans Kannada", system-ui, sans-serif',
  },
  te: {
    name: "Telugu",
    nativeName: "తెలుగు",
    dir: "ltr",
    fontFamily: '"Noto Sans Telugu", system-ui, sans-serif',
  },
  ta: {
    name: "Tamil",
    nativeName: "தமிழ்",
    dir: "ltr",
    fontFamily: '"Noto Sans Tamil", system-ui, sans-serif',
  },
};

export const LANGUAGE_ORDER = ["en", "hi", "kn", "te", "ta"];
