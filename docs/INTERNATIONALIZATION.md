# Internationalization (i18n) Documentation

## Overview

The `@medi-aide/i18n` package provides comprehensive internationalization support for the Medi-Aide platform, with primary focus on Canadian bilingual requirements (English and French).

## Installation

```bash
npm install @medi-aide/i18n
```

## Supported Locales

| Locale | Language | Region | Currency |
|--------|----------|--------|----------|
| en-CA | English | Canada | CAD |
| fr-CA | French | Canada | CAD |
| en-US | English | United States | USD |
| fr-FR | French | France | EUR |

## Quick Start

### NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { I18nModule } from '@medi-aide/i18n';

@Module({
  imports: [
    I18nModule.forRoot({
      defaultLocale: 'en-CA',
      fallbackLocale: 'en-CA',
      supportedLocales: ['en-CA', 'fr-CA'],
      detectFromHeader: true,
      detectFromCookie: true,
    }),
  ],
})
export class AppModule {}
```

### Using the I18n Service

```typescript
import { Injectable } from '@nestjs/common';
import { I18nService } from '@medi-aide/i18n';

@Injectable()
export class NotificationService {
  constructor(private i18n: I18nService) {}

  async sendShiftReminder(userId: string, shiftDate: Date) {
    const message = this.i18n.t('notifications', 'shiftReminder', {
      time: this.i18n.formatRelativeTime(shiftDate),
    });
    
    // Send notification...
  }
}
```

## Features

### 1. Translation

```typescript
// Namespace-based translation
const label = i18n.t('caregivers', 'addCaregiver');
// en-CA: "Add Caregiver"
// fr-CA: "Ajouter un aidant"

// With parameters (ICU MessageFormat)
const welcome = i18n.t('common', 'welcome', { name: 'Marie' });
// en-CA: "Welcome, Marie!"
// fr-CA: "Bienvenue, Marie !"

// Pluralization
const items = i18n.t('common', 'itemsPerPage', { count: 5 });
// en-CA: "5 items per page"
// fr-CA: "5 éléments par page"
```

### 2. Date Formatting

```typescript
const date = new Date('2024-03-15T14:30:00');

// Different formats
i18n.formatDate(date, { format: 'short' });  // "2024-03-15"
i18n.formatDate(date, { format: 'medium' }); // "Mar 15, 2024" / "15 mars 2024"
i18n.formatDate(date, { format: 'long' });   // "March 15, 2024" / "15 mars 2024"
i18n.formatDate(date, { format: 'full' });   // "Friday, March 15, 2024"

// With time
i18n.formatDateTime(date, 'medium');
// en-CA: "Mar 15, 2024 2:30 PM"
// fr-CA: "15 mars 2024 14:30"

// Relative time
i18n.formatRelativeTime(date);
// "in 2 hours" / "dans 2 heures"
```

### 3. Number & Currency Formatting

```typescript
// Numbers
i18n.formatNumber(1234567.89);
// en-CA: "1,234,567.89"
// fr-CA: "1 234 567,89"

// Currency
i18n.formatCurrency(99.99);
// en-CA: "$99.99"
// fr-CA: "99,99 $"

// Percentage
i18n.formatPercent(0.85);
// "85%" / "85 %"
```

### 4. Canadian-Specific Formatting

```typescript
// Phone numbers
i18n.formatPhone('4165551234');
// "(416) 555-1234"

// Postal codes
i18n.formatPostalCode('M5V2A8');
// "M5V 2A8"

// SIN (masked)
i18n.formatSIN('123456789');
// "***-***-789"

// Health card (Ontario)
i18n.formatHealthCard('1234567890AB', 'ON');
// "1234-567-890-AB"

// Province names
i18n.getProvinceName('QC');
// en-CA: "Quebec"
// fr-CA: "Québec"

// Full address
i18n.formatAddress({
  street: '123 Main Street',
  unit: 'Suite 400',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5V2A8',
});
// "Suite 400-123 Main Street
//  Toronto, Ontario M5V 2A8"
```

## Translation Namespaces

| Namespace | Description |
|-----------|-------------|
| common | Common UI labels and actions |
| auth | Authentication-related text |
| caregivers | Caregiver management |
| patients | Patient management |
| scheduling | Shift and schedule text |
| clinical | Clinical/medical terms |
| billing | Billing and payments |
| errors | Error messages |
| notifications | Notification templates |
| reports | Report-related text |

## Locale Detection

The middleware automatically detects locale from (in priority order):

1. **User Profile**: `user.locale` from authenticated user
2. **Query Parameter**: `?lang=fr-CA`
3. **Cookie**: `locale` cookie
4. **Accept-Language Header**: Browser language preference

## React/Frontend Integration

```typescript
import { useI18n } from '@medi-aide/i18n/react';

function PatientCard({ patient }) {
  const { t, formatDate, formatPhone } = useI18n();

  return (
    <div>
      <h2>{patient.name}</h2>
      <p>{t('patients.careLevel')}: {patient.careLevel}</p>
      <p>{formatPhone(patient.phone)}</p>
      <p>{t('common.created')}: {formatDate(patient.createdAt)}</p>
    </div>
  );
}
```

## Adding Translations

### In Code

Translations are defined in `translation.service.ts`. Add new keys to both `EN_CA_TRANSLATIONS` and `FR_CA_TRANSLATIONS`.

### Best Practices

1. **Use namespaces** to organize translations logically
2. **Use ICU MessageFormat** for complex strings with variables
3. **Always provide both languages** for any new key
4. **Use context-appropriate terms** (Canadian healthcare terminology)

## Controller Decorators

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentLocale, I18nCtx } from '@medi-aide/i18n';

@Controller('patients')
export class PatientController {
  @Get()
  async list(@CurrentLocale() locale: string, @I18nCtx() ctx: I18nContext) {
    // locale: 'en-CA' or 'fr-CA'
    // ctx: { locale, timezone, currency }
  }
}
```

## Database Considerations

For bilingual content in the database, use JSON columns:

```typescript
@Entity()
export class CarePlan {
  @Column('jsonb')
  title: {
    en: string;
    fr: string;
  };

  @Column('jsonb')
  description: {
    en: string;
    fr: string;
  };
}
```

Then in service:

```typescript
getTitle(carePlan: CarePlan, locale: SupportedLocale) {
  const lang = locale.split('-')[0];
  return carePlan.title[lang] || carePlan.title['en'];
}
```

## Testing

```typescript
describe('I18nService', () => {
  let i18n: I18nService;

  beforeEach(() => {
    i18n = new I18nService(/* ... */);
  });

  it('should translate in English', () => {
    i18n.setContext({ locale: 'en-CA' });
    expect(i18n.t('common', 'save')).toBe('Save');
  });

  it('should translate in French', () => {
    i18n.setContext({ locale: 'fr-CA' });
    expect(i18n.t('common', 'save')).toBe('Enregistrer');
  });
});
```

## Language Switching

### Frontend Component

```tsx
function LanguageSwitcher() {
  const { locale, setLocale, getSupportedLocales, getLocaleDisplayName } = useI18n();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {getSupportedLocales().map((loc) => (
        <option key={loc} value={loc}>
          {getLocaleDisplayName(loc)}
        </option>
      ))}
    </select>
  );
}
```

### API Endpoint

```
GET /api/v1/locale
Response: { locale: "en-CA", supported: ["en-CA", "fr-CA"] }

POST /api/v1/locale
Body: { locale: "fr-CA" }
Response: { locale: "fr-CA" }
```
