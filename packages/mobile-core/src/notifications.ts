/**
 * Push Notifications Module
 * Handles push notifications for mobile app
 */

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationConfig {
  vapidPublicKey: string;
  onNotification?: (notification: PushNotification) => void;
  onAction?: (action: string, notification: PushNotification) => void;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register for push notifications
 */
export async function registerPushNotifications(
  config: NotificationConfig,
): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    throw new Error('Push notifications not supported');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToArrayBuffer(config.vapidPublicKey),
  });

  return subscription;
}

/**
 * Unregister from push notifications
 */
export async function unregisterPushNotifications(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    return subscription.unsubscribe();
  }

  return false;
}

/**
 * Show local notification
 */
export async function showNotification(notification: PushNotification): Promise<void> {
  if (getNotificationPermission() !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;

  const options: NotificationOptions & { actions?: NotificationAction[] } = {
    body: notification.body,
    icon: notification.icon || '/icons/notification-icon.png',
    badge: notification.badge,
    data: notification.data,
    tag: notification.tag,
    requireInteraction: notification.requireInteraction,
    actions: notification.actions,
  };

  await registration.showNotification(notification.title, options);
}

/**
 * Predefined notification templates
 */
export const NotificationTemplates = {
  shiftReminder: (shiftTime: string, patientName: string): PushNotification => ({
    id: `shift-reminder-${Date.now()}`,
    title: '⏰ Shift Reminder',
    body: `Your shift with ${patientName} starts at ${shiftTime}`,
    tag: 'shift-reminder',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'navigate', title: 'Get Directions' },
    ],
  }),

  clockInReminder: (patientName: string): PushNotification => ({
    id: `clock-in-${Date.now()}`,
    title: '📍 Don\'t Forget to Clock In',
    body: `Remember to clock in for your shift with ${patientName}`,
    tag: 'clock-in',
    requireInteraction: true,
    actions: [
      { action: 'clock-in', title: 'Clock In Now' },
    ],
  }),

  medicationReminder: (patientName: string, medication: string): PushNotification => ({
    id: `med-reminder-${Date.now()}`,
    title: '💊 Medication Due',
    body: `${medication} is due for ${patientName}`,
    tag: 'medication',
    requireInteraction: true,
    actions: [
      { action: 'administer', title: 'Mark Administered' },
      { action: 'skip', title: 'Skip' },
    ],
  }),

  newMessage: (senderName: string, preview: string): PushNotification => ({
    id: `message-${Date.now()}`,
    title: `💬 New Message from ${senderName}`,
    body: preview.length > 100 ? preview.substring(0, 97) + '...' : preview,
    tag: 'message',
    actions: [
      { action: 'reply', title: 'Reply' },
      { action: 'view', title: 'View' },
    ],
  }),

  scheduleUpdate: (type: 'added' | 'changed' | 'cancelled'): PushNotification => ({
    id: `schedule-${Date.now()}`,
    title: '📅 Schedule Update',
    body: type === 'added'
      ? 'A new shift has been added to your schedule'
      : type === 'changed'
        ? 'One of your shifts has been modified'
        : 'A shift has been cancelled',
    tag: 'schedule',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Schedule' },
    ],
  }),

  emergencyAlert: (patientName: string, alertType: string): PushNotification => ({
    id: `emergency-${Date.now()}`,
    title: '🚨 URGENT: Care Recipient Alert',
    body: `${alertType} alert for ${patientName}`,
    tag: 'emergency',
    requireInteraction: true,
    actions: [
      { action: 'respond', title: 'Respond Now' },
      { action: 'call', title: 'Call Supervisor' },
    ],
  }),
};

/**
 * Schedule local notification
 */
export async function scheduleNotification(
  notification: PushNotification,
  triggerTime: Date,
): Promise<void> {
  const delay = triggerTime.getTime() - Date.now();

  if (delay <= 0) {
    await showNotification(notification);
    return;
  }

  // Store scheduled notification
  const scheduled = JSON.parse(localStorage.getItem('scheduled-notifications') || '[]');
  scheduled.push({
    notification,
    triggerAt: triggerTime.toISOString(),
  });
  localStorage.setItem('scheduled-notifications', JSON.stringify(scheduled));

  // Set timeout (for current session only)
  setTimeout(() => showNotification(notification), delay);
}

/**
 * Cancel scheduled notification
 */
export function cancelScheduledNotification(tag: string): void {
  const scheduled = JSON.parse(localStorage.getItem('scheduled-notifications') || '[]');
  const filtered = scheduled.filter((s: any) => s.notification.tag !== tag);
  localStorage.setItem('scheduled-notifications', JSON.stringify(filtered));
}

/**
 * Convert VAPID key
 */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer.slice(
    outputArray.byteOffset,
    outputArray.byteOffset + outputArray.byteLength,
  );
}
