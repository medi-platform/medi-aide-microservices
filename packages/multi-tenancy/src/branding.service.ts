/**
 * Tenant Branding Service
 * Manages white-label branding and customization
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantContextService } from './tenant.context';

export interface BrandingConfig {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  errorColor?: string;
  successColor?: string;
  warningColor?: string;

  // Logo & Favicon
  logoUrl?: string;
  logoLightUrl?: string; // For dark backgrounds
  faviconUrl?: string;

  // Company Info
  companyName: string;
  tagline?: string;

  // Email Branding
  emailHeaderLogoUrl?: string;
  emailFooterText?: string;
  emailFromName?: string;

  // Login Page
  loginBackgroundUrl?: string;
  loginMessage?: string;

  // Custom CSS
  customCss?: string;

  // Font
  fontFamily?: string;
  headingFontFamily?: string;
}

export interface ThemeVariables {
  '--primary-color': string;
  '--secondary-color': string;
  '--accent-color': string;
  '--background-color': string;
  '--text-color': string;
  '--error-color': string;
  '--success-color': string;
  '--warning-color': string;
  '--font-family': string;
  '--heading-font-family': string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  errorColor: '#dc2626',
  successColor: '#16a34a',
  warningColor: '#f59e0b',
  companyName: 'Medi-Aide',
  tagline: 'Healthcare Management Platform',
  fontFamily: 'Inter, system-ui, sans-serif',
  headingFontFamily: 'Inter, system-ui, sans-serif',
};

@Injectable()
export class BrandingService {
  constructor(
    private tenantService: TenantService,
    private tenantContext: TenantContextService,
  ) {}

  /**
   * Get branding for current tenant
   */
  async getCurrentBranding(): Promise<BrandingConfig> {
    const ctx = this.tenantContext.getContext();
    if (!ctx) {
      return DEFAULT_BRANDING;
    }

    return this.getTenantBranding(ctx.tenantId);
  }

  /**
   * Get branding for a specific tenant
   */
  async getTenantBranding(tenantId: string): Promise<BrandingConfig> {
    const tenant = await this.tenantService.getTenant(tenantId);

    return {
      ...DEFAULT_BRANDING,
      ...tenant.branding,
      ...(tenant.settings?.branding || {}),
    };
  }

  /**
   * Update tenant branding
   */
  async updateBranding(
    tenantId: string,
    branding: Partial<BrandingConfig>,
  ): Promise<BrandingConfig> {
    // Validate colors
    if (branding.primaryColor && !this.isValidColor(branding.primaryColor)) {
      throw new BadRequestException('Invalid primary color');
    }
    if (branding.secondaryColor && !this.isValidColor(branding.secondaryColor)) {
      throw new BadRequestException('Invalid secondary color');
    }

    // Validate URLs
    if (branding.logoUrl && !this.isValidUrl(branding.logoUrl)) {
      throw new BadRequestException('Invalid logo URL');
    }

    const mergedBranding: BrandingConfig = {
      ...(await this.getTenantBranding(tenantId)),
      ...branding,
    };

    await this.tenantService.updateTenant(tenantId, {
      branding: {
        primaryColor: mergedBranding.primaryColor,
        secondaryColor: mergedBranding.secondaryColor,
        logoUrl: mergedBranding.logoUrl,
        faviconUrl: mergedBranding.faviconUrl,
        companyName: mergedBranding.companyName,
      },
      settings: { branding: mergedBranding },
    });

    return this.getTenantBranding(tenantId);
  }

  /**
   * Generate CSS variables for branding
   */
  async generateThemeVariables(tenantId?: string): Promise<ThemeVariables> {
    const branding = tenantId
      ? await this.getTenantBranding(tenantId)
      : await this.getCurrentBranding();

    return {
      '--primary-color': branding.primaryColor,
      '--secondary-color': branding.secondaryColor,
      '--accent-color': branding.accentColor || branding.primaryColor,
      '--background-color': branding.backgroundColor || '#ffffff',
      '--text-color': branding.textColor || '#1f2937',
      '--error-color': branding.errorColor || '#dc2626',
      '--success-color': branding.successColor || '#16a34a',
      '--warning-color': branding.warningColor || '#f59e0b',
      '--font-family': branding.fontFamily || 'Inter, system-ui, sans-serif',
      '--heading-font-family': branding.headingFontFamily || branding.fontFamily || 'Inter, system-ui, sans-serif',
    };
  }

  /**
   * Generate CSS string for branding
   */
  async generateCss(tenantId?: string): Promise<string> {
    const variables = await this.generateThemeVariables(tenantId);
    const branding = tenantId
      ? await this.getTenantBranding(tenantId)
      : await this.getCurrentBranding();

    let css = ':root {\n';
    for (const [key, value] of Object.entries(variables)) {
      css += `  ${key}: ${value};\n`;
    }
    css += '}\n';

    // Add custom CSS if defined
    if (branding.customCss) {
      css += `\n/* Custom CSS */\n${branding.customCss}\n`;
    }

    return css;
  }

  /**
   * Generate email template with branding
   */
  async generateEmailTemplate(
    tenantId: string,
    content: string,
  ): Promise<string> {
    const branding = await this.getTenantBranding(tenantId);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: ${branding.fontFamily}; color: ${branding.textColor}; }
    .header { background-color: ${branding.primaryColor}; padding: 20px; }
    .content { padding: 20px; }
    .footer { background-color: #f3f4f6; padding: 20px; font-size: 12px; }
    a { color: ${branding.primaryColor}; }
  </style>
</head>
<body>
  <div class="header">
    ${branding.emailHeaderLogoUrl
      ? `<img src="${branding.emailHeaderLogoUrl}" alt="${branding.companyName}" height="40" />`
      : `<h1 style="color: white; margin: 0;">${branding.companyName}</h1>`
    }
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    ${branding.emailFooterText || `&copy; ${new Date().getFullYear()} ${branding.companyName}. All rights reserved.`}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate login page config
   */
  async getLoginPageConfig(tenantId: string): Promise<{
    logoUrl?: string;
    companyName: string;
    tagline?: string;
    backgroundUrl?: string;
    message?: string;
    primaryColor: string;
  }> {
    const branding = await this.getTenantBranding(tenantId);

    return {
      logoUrl: branding.logoUrl,
      companyName: branding.companyName,
      tagline: branding.tagline,
      backgroundUrl: branding.loginBackgroundUrl,
      message: branding.loginMessage,
      primaryColor: branding.primaryColor,
    };
  }

  /**
   * Validate uploaded logo
   */
  validateLogo(
    file: { mimetype: string; size: number },
  ): { valid: boolean; error?: string } {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type. Use PNG, JPEG, SVG, or WebP.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 2MB.' };
    }

    return { valid: true };
  }

  /**
   * Generate favicon sizes
   */
  async generateFaviconSizes(
    tenantId: string,
    sourceUrl: string,
  ): Promise<{ sizes: { size: number; url: string }[] }> {
    // In production, this would use an image processing library
    // to generate different favicon sizes
    const sizes = [16, 32, 48, 64, 128, 256];

    return {
      sizes: sizes.map((size) => ({
        size,
        url: `${sourceUrl}?size=${size}`, // Simplified
      })),
    };
  }

  private isValidColor(color: string): boolean {
    // Check hex color format
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
