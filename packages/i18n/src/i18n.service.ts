/**
 * Unified I18n Service
 * Combines translation, locale, and formatting services
 */

import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { LocaleService } from './locale.service';
import { FormatterService } from './formatters';
import {
  SupportedLocale,
  TranslationNamespace,
  LocaleConfig,
  DateFormatOptions,
  NumberFormatOptions,
  I18nContext,
  DEFAULT_LOCALE,
} from './types';

@Injectable({ scope: Scope.REQUEST })
export class I18nService {
  private context: I18nContext;

  constructor(
    private translationService: TranslationService,
    private localeService: LocaleService,
    private formatterService: FormatterService,
  ) {
    this.context = {
      locale: DEFAULT_LOCALE,
      timezone: 'America/Toronto',
      currency: 'CAD',
    };
  }

  /**
   * Set I18n context for this request
   */
  setContext(context: Partial<I18nContext>): void {
    this.context = { ...this.context, ...context };

    if (context.locale) {
      this.translationService.setLocale(context.locale);
      this.localeService.setLocale(context.locale);
      this.formatterService.setLocale(context.locale);
    }
  }

  /**
   * Get current context
   */
  getContext(): I18nContext {
    return { ...this.context };
  }

  /**
   * Get current locale
   */
  getLocale(): SupportedLocale {
    return this.context.locale;
  }

  /**
   * Get locale configuration
   */
  getLocaleConfig(): LocaleConfig {
    return this.localeService.getConfig(this.context.locale);
  }

  // ==================== Translation ====================

  /**
   * Translate a key
   */
  t(namespace: TranslationNamespace, key: string, params?: Record<string, any>): string {
    return this.translationService.t(namespace, key, params);
  }

  /**
   * Translate with dot notation
   */
  translate(key: string, params?: Record<string, any>): string {
    return this.translationService.translate(key, params);
  }

  /**
   * Check if translation exists
   */
  hasTranslation(namespace: TranslationNamespace, key: string): boolean {
    return this.translationService.has(namespace, key);
  }

  // ==================== Date Formatting ====================

  /**
   * Format date
   */
  formatDate(date: Date | string | number, options?: DateFormatOptions): string {
    return this.formatterService.formatDate(date, options);
  }

  /**
   * Format time
   */
  formatTime(date: Date | string | number, format?: 'short' | 'medium' | 'long'): string {
    return this.formatterService.formatTime(date, format);
  }

  /**
   * Format date and time
   */
  formatDateTime(date: Date | string | number, format?: 'short' | 'medium' | 'long'): string {
    return this.formatterService.formatDate(date, { format, includeTime: true });
  }

  /**
   * Format relative time
   */
  formatRelativeTime(date: Date | string | number, baseDate?: Date): string {
    return this.formatterService.formatRelativeTime(date, baseDate);
  }

  // ==================== Number Formatting ====================

  /**
   * Format number
   */
  formatNumber(value: number, options?: NumberFormatOptions): string {
    return this.formatterService.formatNumber(value, options);
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency?: string): string {
    return this.formatterService.formatCurrency(value, currency || this.context.currency);
  }

  /**
   * Format percentage
   */
  formatPercent(value: number, decimals?: number): string {
    return this.formatterService.formatPercent(value, decimals);
  }

  // ==================== Canadian-specific Formatting ====================

  /**
   * Format phone number
   */
  formatPhone(phone: string): string {
    return this.formatterService.formatPhone(phone);
  }

  /**
   * Format postal code
   */
  formatPostalCode(postalCode: string): string {
    return this.formatterService.formatPostalCode(postalCode);
  }

  /**
   * Format SIN
   */
  formatSIN(sin: string, mask?: boolean): string {
    return this.formatterService.formatSIN(sin, mask);
  }

  /**
   * Format health card
   */
  formatHealthCard(number: string, province: string): string {
    return this.formatterService.formatHealthCard(number, province);
  }

  /**
   * Get province name
   */
  getProvinceName(code: string): string {
    return this.formatterService.getProvinceName(code);
  }

  /**
   * Format address
   */
  formatAddress(address: {
    street: string;
    unit?: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  }): string {
    return this.formatterService.formatAddress(address);
  }

  // ==================== Utility Formatting ====================

  /**
   * Format duration
   */
  formatDuration(minutes: number): string {
    return this.formatterService.formatDuration(minutes);
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    return this.formatterService.formatFileSize(bytes);
  }

  // ==================== Locale Info ====================

  /**
   * Get supported locales
   */
  getSupportedLocales(): SupportedLocale[] {
    return this.localeService.getSupportedLocales();
  }

  /**
   * Get locale display name
   */
  getLocaleDisplayName(locale: SupportedLocale): string {
    return this.localeService.getDisplayName(locale, this.context.locale);
  }

  /**
   * Check if locale is supported
   */
  isLocaleSupported(locale: string): boolean {
    return this.localeService.isSupported(locale);
  }
}
