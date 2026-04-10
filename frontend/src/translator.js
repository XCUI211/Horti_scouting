import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import nl from "./locales/nl.json";
import en from "./locales/en.json";


let savedLanguage = "nl";

try {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  savedLanguage = storedUser?.language || "nl";
} catch (err) {
  savedLanguage = "nl";
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nl: { translation: nl },
    },
    lng: savedLanguage,
    fallbackLng: "nl",
    supportedLngs: ["en", "nl"],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;