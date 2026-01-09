/**
 * I18n Middleware
 * Middleware for detecting and setting locale
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LocaleService } from './locale.service';
import { I18nService } from './i18n.service';
import { SupportedLocale, DEFAULT_LOCALE } from './types';

export interface I18nRequest extends Request {
  locale: SupportedLocale;
  language: string;
  timezone: string;
  currency: string;
  i18n: I18nService;
}

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(
    private localeService: LocaleService,
    private i18nService: I18nService,
  ) {}

  use(req: I18nRequest, res: Response, next: NextFunction): void {
    // Detect locale
    const locale = this.localeService.detectLocale({
      headers: req.headers as Record<string, string>,
      cookies: req.cookies,
      query: req.query as Record<string, string>,
      user: (req as any).user,
    });

    // Get timezone from user or headers
    const timezone = this.extractTimezone(req) || 'America/Toronto';

    // Get currency from tenant or user
    const currency = this.extractCurrency(req) || 'CAD';

    // Set on request
    req.locale = locale;
    req.language = locale.split('-')[0];
    req.timezone = timezone;
    req.currency = currency;

    // Set I18n context
    this.i18nService.setContext({
      locale,
      timezone,
      currency,
    });

    req.i18n = this.i18nService;

    // Set response headers for client
    res.setHeader('Content-Language', locale);
    res.setHeader('X-Locale', locale);

    next();
  }

  private extractTimezone(req: Request): string | undefined {
    // From header
    if (req.headers['x-timezone']) {
      return req.headers['x-timezone'] as string;
    }

    // From user profile
    const user = (req as any).user;
    if (user?.timezone) {
      return user.timezone;
    }

    // From tenant settings
    const tenant = (req as any).tenant;
    if (tenant?.settings?.timezone) {
      return tenant.settings.timezone;
    }

    return undefined;
  }

  private extractCurrency(req: Request): string | undefined {
    // From tenant settings
    const tenant = (req as any).tenant;
    if (tenant?.settings?.currency) {
      return tenant.settings.currency;
    }

    return undefined;
  }
}

/**
 * Locale cookie setter middleware
 */
@Injectable()
export class LocaleCookieMiddleware implements NestMiddleware {
  use(req: I18nRequest, res: Response, next: NextFunction): void {
    // If locale is in query, set cookie for persistence
    const queryLocale = req.query.lang as string;
    if (queryLocale && this.isValidLocale(queryLocale)) {
      res.cookie('locale', queryLocale, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    next();
  }

  private isValidLocale(locale: string): boolean {
    return ['en-CA', 'fr-CA', 'en-US', 'fr-FR'].includes(locale);
  }
}
