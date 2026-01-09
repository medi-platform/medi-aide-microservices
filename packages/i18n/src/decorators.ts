/**
 * I18n Decorators
 * Decorators for accessing internationalization context
 */

import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { SupportedLocale, I18nContext } from './types';

/**
 * Get current locale from request
 */
export const CurrentLocale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SupportedLocale => {
    const request = ctx.switchToHttp().getRequest();
    return request.locale || request.i18n?.locale || 'en-CA';
  },
);

/**
 * Get full I18n context from request
 */
export const I18nCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): I18nContext => {
    const request = ctx.switchToHttp().getRequest();
    return {
      locale: request.locale || 'en-CA',
      timezone: request.timezone || 'America/Toronto',
      currency: request.currency || 'CAD',
    };
  },
);

/**
 * Get language from request (e.g., 'en', 'fr')
 */
export const CurrentLanguage = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const locale: SupportedLocale = request.locale || 'en-CA';
    return locale.split('-')[0];
  },
);

/**
 * Decorator to mark a field as translatable
 * Used with entity decorators
 */
export const Translatable = (): PropertyDecorator => {
  return (target: Object, propertyKey: string | symbol) => {
    const translatableFields = Reflect.getMetadata('translatable', target.constructor) || [];
    translatableFields.push(propertyKey);
    Reflect.defineMetadata('translatable', translatableFields, target.constructor);
  };
};

/**
 * Get translatable field names from an entity
 */
export function getTranslatableFields(target: Function): string[] {
  return Reflect.getMetadata('translatable', target) || [];
}

/**
 * Decorator to set required locale for endpoint
 */
export const RequireLocale = (locale: SupportedLocale) =>
  SetMetadata('required-locale', locale);

/**
 * Decorator to specify supported locales for endpoint
 */
export const SupportedLocales = (...locales: SupportedLocale[]) =>
  SetMetadata('supported-locales', locales);
