/**
 * Locale Service
 * Manages locale detection and configuration
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import { SupportedLocale, LocaleConfig, LOCALE_CONFIGS, DEFAULT_LOCALE } from './types';

export interface LocaleServiceOptions {
  defaultLocale?: SupportedLocale;
  supportedLocales?: SupportedLocale[];
  detectFromHeader?: boolean;
  detectFromCookie?: boolean;
  detectFromQuery?: boolean;
  cookieName?: string;
  queryParam?: string;
}

@Injectable()
export class LocaleService {
  private currentLocale: SupportedLocale;
  private readonly options: LocaleServiceOptions;

  constructor(@Optional() @Inject('LOCALE_OPTIONS') options?: LocaleServiceOptions) {
    this.options = {
      defaultLocale: DEFAULT_LOCALE,
      supportedLocales: Object.keys(LOCALE_CONFIGS) as SupportedLocale[],
      detectFromHeader: true,
      detectFromCookie: true,
      detectFromQuery: true,
      cookieName: 'locale',
      queryParam: 'lang',
      ...options,
    };

    this.currentLocale = this.options.defaultLocale!;
  }

  /**
   * Detect locale from request
   */
  detectLocale(request: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    query?: Record<string, string>;
    user?: { locale?: string };
  }): SupportedLocale {
    // Priority 1: User preference
    if (request.user?.locale) {
      const userLocale = this.parseLocale(request.user.locale);
      if (userLocale) return userLocale;
    }

    // Priority 2: Query parameter
    if (this.options.detectFromQuery && request.query) {
      const queryLocale = this.parseLocale(request.query[this.options.queryParam!]);
      if (queryLocale) return queryLocale;
    }

    // Priority 3: Cookie
    if (this.options.detectFromCookie && request.cookies) {
      const cookieLocale = this.parseLocale(request.cookies[this.options.cookieName!]);
      if (cookieLocale) return cookieLocale;
    }

    // Priority 4: Accept-Language header
    if (this.options.detectFromHeader && request.headers?.['accept-language']) {
      const headerLocale = this.parseAcceptLanguage(request.headers['accept-language']);
      if (headerLocale) return headerLocale;
    }

    return this.options.defaultLocale!;
  }

  /**
   * Get locale configuration
   */
  getConfig(locale?: SupportedLocale): LocaleConfig {
    return LOCALE_CONFIGS[locale || this.currentLocale];
  }

  /**
   * Set current locale
   */
  setLocale(locale: SupportedLocale): void {
    if (this.isSupported(locale)) {
      this.currentLocale = locale;
    }
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Check if locale is supported
   */
  isSupported(locale: string): locale is SupportedLocale {
    return this.options.supportedLocales!.includes(locale as SupportedLocale);
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return this.options.supportedLocales!;
  }

  /**
   * Get locale display name
   */
  getDisplayName(locale: SupportedLocale, inLocale?: SupportedLocale): string {
    const displayNames: Record<SupportedLocale, Record<SupportedLocale, string>> = {
      'en-CA': {
        'en-CA': 'English (Canada)',
        'fr-CA': 'French (Canada)',
        'en-US': 'English (United States)',
        'fr-FR': 'French (France)',
      },
      'fr-CA': {
        'en-CA': 'Anglais (Canada)',
        'fr-CA': 'Français (Canada)',
        'en-US': 'Anglais (États-Unis)',
        'fr-FR': 'Français (France)',
      },
      'en-US': {
        'en-CA': 'English (Canada)',
        'fr-CA': 'French (Canada)',
        'en-US': 'English (United States)',
        'fr-FR': 'French (France)',
      },
      'fr-FR': {
        'en-CA': 'Anglais (Canada)',
        'fr-CA': 'Français (Canada)',
        'en-US': 'Anglais (États-Unis)',
        'fr-FR': 'Français (France)',
      },
    };

    const targetLocale = inLocale || this.currentLocale;
    return displayNames[targetLocale]?.[locale] || locale;
  }

  /**
   * Get language code from locale
   */
  getLanguage(locale?: SupportedLocale): string {
    return LOCALE_CONFIGS[locale || this.currentLocale].language;
  }

  /**
   * Get region code from locale
   */
  getRegion(locale?: SupportedLocale): string {
    return LOCALE_CONFIGS[locale || this.currentLocale].region;
  }

  private parseLocale(value: string | undefined): SupportedLocale | null {
    if (!value) return null;

    // Exact match
    if (this.isSupported(value)) {
      return value as SupportedLocale;
    }

    // Try with region variation
    const normalized = value.replace('_', '-');
    if (this.isSupported(normalized)) {
      return normalized as SupportedLocale;
    }

    // Try language only
    const language = value.split(/[-_]/)[0].toLowerCase();
    for (const supported of this.options.supportedLocales!) {
      if (supported.toLowerCase().startsWith(language)) {
        return supported;
      }
    }

    return null;
  }

  private parseAcceptLanguage(header: string): SupportedLocale | null {
    // Parse Accept-Language header
    // Format: en-CA,en;q=0.9,fr-CA;q=0.8
    const languages = header
      .split(',')
      .map((part) => {
        const [lang, qValue] = part.trim().split(';q=');
        return {
          lang: lang.trim(),
          q: qValue ? parseFloat(qValue) : 1,
        };
      })
      .sort((a, b) => b.q - a.q);

    for (const { lang } of languages) {
      const locale = this.parseLocale(lang);
      if (locale) return locale;
    }

    return null;
  }
}
