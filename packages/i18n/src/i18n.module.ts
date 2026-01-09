import { Module, DynamicModule, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationService, TranslationServiceOptions } from './translation.service';
import { LocaleService, LocaleServiceOptions } from './locale.service';
import { FormatterService } from './formatters';
import { I18nService } from './i18n.service';
import { I18nMiddleware, LocaleCookieMiddleware } from './middleware';
import { SupportedLocale, DEFAULT_LOCALE } from './types';

export interface I18nModuleOptions {
  defaultLocale?: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  supportedLocales?: SupportedLocale[];
  debug?: boolean;
  detectFromHeader?: boolean;
  detectFromCookie?: boolean;
  detectFromQuery?: boolean;
  persistLocaleCookie?: boolean;
}

@Global()
@Module({})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LocaleCookieMiddleware, I18nMiddleware)
      .forRoutes('*');
  }

  static forRoot(options: I18nModuleOptions = {}): DynamicModule {
    const defaultOptions: I18nModuleOptions = {
      defaultLocale: DEFAULT_LOCALE,
      fallbackLocale: 'en-CA',
      supportedLocales: ['en-CA', 'fr-CA', 'en-US', 'fr-FR'],
      debug: false,
      detectFromHeader: true,
      detectFromCookie: true,
      detectFromQuery: true,
      persistLocaleCookie: true,
      ...options,
    };

    const translationOptions: TranslationServiceOptions = {
      defaultLocale: defaultOptions.defaultLocale,
      fallbackLocale: defaultOptions.fallbackLocale,
      debug: defaultOptions.debug,
    };

    const localeOptions: LocaleServiceOptions = {
      defaultLocale: defaultOptions.defaultLocale,
      supportedLocales: defaultOptions.supportedLocales,
      detectFromHeader: defaultOptions.detectFromHeader,
      detectFromCookie: defaultOptions.detectFromCookie,
      detectFromQuery: defaultOptions.detectFromQuery,
    };

    return {
      module: I18nModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'I18N_OPTIONS',
          useValue: translationOptions,
        },
        {
          provide: 'LOCALE_OPTIONS',
          useValue: localeOptions,
        },
        {
          provide: 'I18N_LOCALE',
          useValue: defaultOptions.defaultLocale,
        },
        TranslationService,
        LocaleService,
        FormatterService,
        I18nService,
        I18nMiddleware,
        LocaleCookieMiddleware,
      ],
      exports: [
        TranslationService,
        LocaleService,
        FormatterService,
        I18nService,
      ],
    };
  }
}
