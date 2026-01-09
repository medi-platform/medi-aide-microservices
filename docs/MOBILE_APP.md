# Mobile App Documentation

**Phase 14: Mobile App Enhancements - Medi-Aide Platform**

Comprehensive mobile application features for caregivers including offline support, biometric authentication, EVV compliance, and real-time messaging.

---

## Table of Contents

1. [Overview](#overview)
2. [Offline Support](#offline-support)
3. [Data Synchronization](#data-synchronization)
4. [Local Storage](#local-storage)
5. [Location Services](#location-services)
6. [Push Notifications](#push-notifications)
7. [Biometric Authentication](#biometric-authentication)
8. [Camera/Photo Capture](#cameraphoto-capture)
9. [React Hooks](#react-hooks)
10. [UI Components](#ui-components)

---

## Overview

The `@medi-aide/mobile-core` package provides essential mobile features:

```bash
npm install @medi-aide/mobile-core
```

### Features

- **Offline Support** - Work without internet, sync when connected
- **Data Sync** - Automatic background synchronization
- **Local Storage** - IndexedDB-based persistent storage
- **Location/GPS** - EVV compliance with geofencing
- **Push Notifications** - Real-time alerts and reminders
- **Biometric Auth** - Fingerprint/Face ID login
- **Camera** - Photo documentation with watermarks
- **Network Detection** - Online/offline/slow network handling

---

## Offline Support

### Offline Queue

Queue actions when offline for later sync:

```typescript
import { getOfflineQueue } from '@medi-aide/mobile-core';

const queue = getOfflineQueue();

// Queue an action
queue.enqueue('CREATE', 'note', {
  patientId: 'patient-123',
  content: 'Patient showed improvement...',
  createdAt: new Date().toISOString(),
});

// Check queue status
console.log(queue.size); // 1
console.log(queue.hasPending); // true

// Subscribe to changes
queue.subscribe((actions) => {
  console.log('Queue updated:', actions.length);
});
```

### Queue Actions

```typescript
// Enqueue different operations
queue.enqueue('CREATE', 'vital', { patientId: 'p1', type: 'blood_pressure', value: 120 });
queue.enqueue('UPDATE', 'shift', { id: 'shift-1', status: 'completed' });
queue.enqueue('DELETE', 'task', { id: 'task-1' });

// Retry failed items
queue.retry('action-id');
queue.retryAll();

// Clear completed/failed
queue.clear('failed');
```

---

## Data Synchronization

### Sync Manager

```typescript
import { createSyncManager } from '@medi-aide/mobile-core';

const syncManager = createSyncManager({
  apiBaseUrl: 'https://api.medi-aide.com',
  getAuthToken: async () => localStorage.getItem('token') || '',
  onSyncStart: () => console.log('Sync started'),
  onSyncComplete: (results) => console.log('Synced:', results),
  onSyncError: (error) => console.error('Sync failed:', error),
  onConflict: async (action, serverData) => {
    // Handle conflicts
    return 'local'; // or 'server' or 'merge'
  },
});

// Start automatic sync (every 30 seconds)
syncManager.startAutoSync(30000);

// Manual sync
await syncManager.sync();

// Check status
console.log(syncManager.status);
// { isSyncing: false, pending: 0, failed: 0 }
```

---

## Local Storage

IndexedDB-based storage for offline data:

```typescript
import { LocalStorage } from '@medi-aide/mobile-core';

// Save shift
await LocalStorage.saveShift({
  id: 'shift-1',
  patientId: 'patient-1',
  patientName: 'John Doe',
  startTime: '2024-01-01T09:00:00Z',
  endTime: '2024-01-01T13:00:00Z',
  status: 'scheduled',
  tasks: [],
  notes: '',
});

// Get today's shifts
const todayShifts = await LocalStorage.getTodayShifts();

// Get patient
const patient = await LocalStorage.getPatient('patient-1');

// Save clinical note
await LocalStorage.saveNote({
  id: 'note-1',
  shiftId: 'shift-1',
  patientId: 'patient-1',
  content: 'Patient in good spirits today.',
  type: 'general',
  createdAt: new Date().toISOString(),
});

// Cache API responses
await LocalStorage.setCache('schedule-week', scheduleData, 3600000); // 1 hour TTL
const cached = await LocalStorage.getCache('schedule-week');

// Clear all data
await LocalStorage.clearAll();
```

---

## Location Services

### Get Current Location

```typescript
import { 
  getCurrentLocation, 
  watchLocation,
  isWithinGeofence,
  validateEVVLocation 
} from '@medi-aide/mobile-core';

// Get location once
const location = await getCurrentLocation({
  enableHighAccuracy: true,
  timeout: 10000,
});
console.log(location);
// { latitude: 43.6532, longitude: -79.3832, accuracy: 10, ... }

// Watch location changes
const stopWatching = watchLocation(
  (location) => console.log('New location:', location),
  (error) => console.error('Location error:', error),
);

// Stop watching
stopWatching();
```

### EVV Verification

```typescript
// Patient's home location
const patientHome = {
  latitude: 43.6532,
  longitude: -79.3832,
  radius: 100, // 100 meters
};

// Validate caregiver is at patient location
const result = await validateEVVLocation(patientHome, 50);

if (result.valid) {
  console.log('Location verified!');
  // Proceed with clock-in
} else {
  console.log(`Too far: ${result.distance}m away`);
}
```

### Geofencing

```typescript
// Check if within geofence
const isAtLocation = isWithinGeofence(currentLocation, patientHome);

// Calculate distance
const distance = calculateDistance(
  currentLocation.latitude,
  currentLocation.longitude,
  patientHome.latitude,
  patientHome.longitude,
);
console.log(`Distance: ${distance}m`);
```

---

## Push Notifications

### Setup

```typescript
import { 
  registerPushNotifications,
  showNotification,
  NotificationTemplates 
} from '@medi-aide/mobile-core';

// Request permission and register
const subscription = await registerPushNotifications({
  vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY',
});

// Send subscription to server
await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify(subscription),
});
```

### Show Notifications

```typescript
// Custom notification
await showNotification({
  id: 'custom-1',
  title: 'Shift Reminder',
  body: 'Your shift with John Doe starts in 30 minutes',
  tag: 'shift-reminder',
  requireInteraction: true,
  actions: [
    { action: 'view', title: 'View Details' },
    { action: 'navigate', title: 'Get Directions' },
  ],
});

// Use templates
await showNotification(
  NotificationTemplates.shiftReminder('9:00 AM', 'John Doe')
);

await showNotification(
  NotificationTemplates.medicationReminder('John Doe', 'Aspirin 81mg')
);

await showNotification(
  NotificationTemplates.newMessage('Jane Smith', 'Hi, please call when you arrive...')
);
```

### Schedule Notifications

```typescript
import { scheduleNotification, cancelScheduledNotification } from '@medi-aide/mobile-core';

// Schedule for future
const shiftStart = new Date('2024-01-01T09:00:00');
const reminderTime = new Date(shiftStart.getTime() - 30 * 60 * 1000); // 30 min before

await scheduleNotification(
  NotificationTemplates.shiftReminder('9:00 AM', 'John Doe'),
  reminderTime,
);

// Cancel scheduled
cancelScheduledNotification('shift-reminder');
```

---

## Biometric Authentication

### Check Availability

```typescript
import { 
  isBiometricAvailable,
  registerBiometric,
  authenticateWithBiometric,
  hasBiometricEnrolled 
} from '@medi-aide/mobile-core';

// Check if available
const available = await isBiometricAvailable();

// Check if user has enrolled
const enrolled = hasBiometricEnrolled('user-123');
```

### Register Biometric

```typescript
// Get challenge from server
const { challenge } = await fetch('/api/auth/biometric/challenge').then(r => r.json());

// Register
const credential = await registerBiometric({
  rpId: 'medi-aide.com',
  rpName: 'Medi-Aide',
  userId: 'user-123',
  userName: 'john.doe@email.com',
  userDisplayName: 'John Doe',
}, base64ToArrayBuffer(challenge));

// Send credential to server
await fetch('/api/auth/biometric/register', {
  method: 'POST',
  body: JSON.stringify(credentialToBase64(credential)),
});
```

### Authenticate

```typescript
// Get challenge from server
const { challenge } = await fetch('/api/auth/biometric/challenge').then(r => r.json());

// Authenticate
const assertion = await authenticateWithBiometric(
  { rpId: 'medi-aide.com' },
  base64ToArrayBuffer(challenge),
);

// Verify on server
const { token } = await fetch('/api/auth/biometric/verify', {
  method: 'POST',
  body: JSON.stringify(credentialToBase64(assertion)),
}).then(r => r.json());
```

---

## Camera/Photo Capture

### Capture Photo

```typescript
import { 
  openCamera, 
  capturePhoto, 
  closeCamera,
  addWatermark,
  compressImage 
} from '@medi-aide/mobile-core';

// Open camera
const stream = await openCamera({ facingMode: 'environment' });

// Attach to video element
videoElement.srcObject = stream;

// Capture photo
const image = await capturePhoto(videoElement, { quality: 0.85 });

// Add watermark for EVV
const watermarked = await addWatermark(
  image.blob,
  'John Doe - Clock In',
  new Date(),
);

// Compress for upload
const compressed = await compressImage(watermarked, 1280, 0.8);

// Close camera
closeCamera(stream);
```

### Pick from Gallery

```typescript
import { pickImage, fileToDataUrl } from '@medi-aide/mobile-core';

const file = await pickImage('image/*');
if (file) {
  const dataUrl = await fileToDataUrl(file);
  // Display preview
}
```

---

## React Hooks

### Network Status

```typescript
import { useNetworkStatus } from '@medi-aide/mobile-core';

function MyComponent() {
  const { online, status, effectiveType } = useNetworkStatus();

  if (!online) {
    return <div>You're offline</div>;
  }

  if (status === 'slow') {
    return <div>Slow connection ({effectiveType})</div>;
  }

  return <div>Connected</div>;
}
```

### Offline Queue

```typescript
import { useOfflineQueue } from '@medi-aide/mobile-core';

function SyncIndicator() {
  const { pending, failed } = useOfflineQueue();

  return (
    <div>
      {pending > 0 && <span>{pending} pending</span>}
      {failed > 0 && <span>{failed} failed</span>}
    </div>
  );
}
```

### Location

```typescript
import { useLocation } from '@medi-aide/mobile-core';

function LocationDisplay() {
  const { location, loading, error, refresh } = useLocation({ watch: true });

  if (loading) return <div>Getting location...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Lat: {location?.latitude}</p>
      <p>Lng: {location?.longitude}</p>
      <p>Accuracy: ±{location?.accuracy}m</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Biometric

```typescript
import { useBiometric } from '@medi-aide/mobile-core';

function BiometricLogin({ userId }) {
  const { available, enrolled, loading } = useBiometric(userId);

  if (loading) return <div>Checking...</div>;
  if (!available) return <div>Biometric not available</div>;
  if (!enrolled) return <button>Enable Biometric Login</button>;

  return <button>Login with Biometric</button>;
}
```

### More Hooks

```typescript
// Today's shifts
const { data: shifts, loading } = useTodayShifts();

// Patient data
const { data: patient } = usePatient('patient-123');

// Notification permission
const permission = useNotificationPermission();

// Debounce
const debouncedSearch = useDebounce(searchTerm, 300);

// Pull to refresh
const { refreshing } = usePullToRefresh(async () => {
  await fetchData();
});

// Viewport
const { width, height } = useViewport();

// Orientation
const orientation = useOrientation(); // 'portrait' | 'landscape'
```

---

## UI Components

### Offline Indicator

```tsx
import { OfflineIndicator } from '@medi-aide/mobile-core';

function App() {
  return (
    <>
      <OfflineIndicator showPending />
      {/* Your app content */}
    </>
  );
}
```

### Sync Status

```tsx
import { SyncStatus } from '@medi-aide/mobile-core';

function SettingsPage() {
  return <SyncStatus onRetry={handleSync} />;
}
```

### Location Verifier

```tsx
import { LocationVerifier } from '@medi-aide/mobile-core';

function ClockIn({ patient }) {
  return (
    <LocationVerifier
      patientLocation={{
        latitude: patient.address.latitude,
        longitude: patient.address.longitude,
        radius: 100,
      }}
      onVerified={(location) => handleClockIn(location)}
      onFailed={(error) => showError(error)}
    />
  );
}
```

### Biometric Prompt

```tsx
import { BiometricPrompt } from '@medi-aide/mobile-core';

function Login({ user }) {
  return (
    <BiometricPrompt
      userId={user.id}
      userName={user.email}
      userDisplayName={user.name}
      rpId="medi-aide.com"
      rpName="Medi-Aide"
      mode="authenticate"
      onSuccess={(credential) => handleLogin(credential)}
      onCancel={() => showPasswordForm()}
    />
  );
}
```

### Camera Capture

```tsx
import { CameraCapture } from '@medi-aide/mobile-core';

function DocumentPhoto({ patientName }) {
  return (
    <CameraCapture
      watermark={`${patientName} - Visit Documentation`}
      onCapture={(image) => uploadPhoto(image)}
      onCancel={() => goBack()}
    />
  );
}
```

### Pull to Refresh

```tsx
import { PullToRefresh } from '@medi-aide/mobile-core';

function ShiftList() {
  return (
    <PullToRefresh onRefresh={fetchShifts}>
      {shifts.map(shift => <ShiftCard key={shift.id} shift={shift} />)}
    </PullToRefresh>
  );
}
```

---

## Best Practices

### 1. Always Handle Offline State

```typescript
import { isOnline, onOnline } from '@medi-aide/mobile-core';

async function saveData(data) {
  if (isOnline()) {
    await api.post('/data', data);
  } else {
    queue.enqueue('CREATE', 'data', data);
  }
}

// Auto-sync when back online
onOnline(() => syncManager.sync());
```

### 2. Cache Important Data

```typescript
// Cache patient data on login
const patients = await api.get('/patients');
for (const patient of patients) {
  await LocalStorage.savePatient(patient);
}
```

### 3. Handle Location Errors Gracefully

```typescript
try {
  const result = await validateEVVLocation(patientHome);
  if (result.valid) {
    proceed();
  } else {
    showManualOverride();
  }
} catch (error) {
  showLocationSettings();
}
```

### 4. Use Watermarks for EVV Photos

```typescript
const image = await capturePhoto(videoElement);
const watermarked = await addWatermark(
  image.blob,
  `${patientName} - ${new Date().toLocaleString()}`,
);
```

---

*Last Updated: Phase 14 - Mobile App Enhancements*
