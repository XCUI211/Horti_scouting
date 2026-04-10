import { describe, it, expect, beforeEach } from "vitest";
import i18n from "./translator";

describe("translator i18n config", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("nl");
  });

  it("starts in Dutch", () => {
    expect(i18n.language).toBe("nl");
  });
  it("doesn't start in English", () => {
    expect(i18n.language).not.toBe("en");
  });

  it("has Dutch as fallback language", () => {
    expect(i18n.options.fallbackLng).toContain("nl");
  });
  it("doesn't have English as fallback language", () => {
    expect(i18n.options.fallbackLng).not.toContain("en");
  });

  it("loads Dutch translations", () => {
    expect(i18n.t("test.translation")).toBe("Dit is een test vertaling");
  });

  it("can switch to English", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.language).toBe("en");
    expect(i18n.t("test.translation")).toBe("This is a test translation");
  });

  it("can switch back Dutch", async () => {
    await i18n.changeLanguage("nl");
    expect(i18n.language).toBe("nl");
    expect(i18n.t("test.translation")).toBe("Dit is een test vertaling");
  });

    it("can not switch to a language it doesn't have", async () => {
    await i18n.changeLanguage("fr");
    expect(i18n.language).not.toBe("fr");
    expect(i18n.language).toBe("nl");
    expect(i18n.t("test.translation")).toBe("Dit is een test vertaling");
  });

  it("falls back when a key is missing", () => {
    expect(i18n.t("missing.key")).toBe("missing.key");
  });

  it("registers both language resources", () => {
    expect(i18n.hasResourceBundle("nl", "translation")).toBe(true);
    expect(i18n.hasResourceBundle("en", "translation")).toBe(true);
    expect(i18n.hasResourceBundle("fr", "translation")).toBe(false);
  });
});