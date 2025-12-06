# @medi-aide/wellness-dashboard

Package-based micro-app for wellness monitoring components. This is a versioned package that can be imported by the Next.js shell application.

## Features

- **HeartRateMonitor**: Real-time heart rate visualization with zones
- **BurnoutAnalytics**: Burnout risk assessment and recommendations

## Installation

```bash
# In your Next.js app
pnpm add @medi-aide/wellness-dashboard@workspace:*
```

## Usage

```tsx
// In your Next.js page (App Router)
import { HeartRateMonitor, BurnoutAnalytics } from '@medi-aide/wellness-dashboard';

export default function WellnessPage() {
  return (
    <div>
      <HeartRateMonitor />
      <BurnoutAnalytics />
    </div>
  );
}
```

## Why Package-Based Composition?

- ✅ **RSC/SSR-safe**: Works perfectly with Next.js 15+ App Router
- ✅ **Versioned delivery**: SemVer enables progressive rollout
- ✅ **Type-safe**: Full TypeScript support
- ✅ **No runtime federation**: Avoids Module Federation issues

## Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev
```
