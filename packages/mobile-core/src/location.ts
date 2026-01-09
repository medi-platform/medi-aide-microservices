/**
 * Location Services Module
 * GPS tracking for EVV compliance
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const DEFAULT_OPTIONS: LocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Check if geolocation is available
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<PermissionState> {
  if (!isGeolocationAvailable()) {
    return 'denied';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    // Fallback - try to get location
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            resolve('prompt');
          }
        },
      );
    });
  }
}

/**
 * Get current location
 */
export function getCurrentLocation(options: LocationOptions = {}): Promise<LocationData> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('Geolocation not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(new Error(getLocationErrorMessage(error)));
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      },
    );
  });
}

/**
 * Watch location changes
 */
export function watchLocation(
  callback: (location: LocationData) => void,
  errorCallback?: (error: Error) => void,
  options: LocationOptions = {},
): () => void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!isGeolocationAvailable()) {
    errorCallback?.(new Error('Geolocation not available'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      errorCallback?.(new Error(getLocationErrorMessage(error)));
    },
    {
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
      maximumAge: opts.maximumAge,
    },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if location is within geofence
 */
export function isWithinGeofence(
  location: LocationData,
  geofence: GeofenceConfig,
): boolean {
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    geofence.latitude,
    geofence.longitude,
  );

  // Account for GPS accuracy
  const effectiveRadius = geofence.radius + location.accuracy;
  return distance <= effectiveRadius;
}

/**
 * Validate EVV location (within patient's home)
 */
export async function validateEVVLocation(
  patientLocation: GeofenceConfig,
  requiredAccuracy: number = 50,
): Promise<{
  valid: boolean;
  location: LocationData;
  distance: number;
  message: string;
}> {
  const location = await getCurrentLocation({ enableHighAccuracy: true });

  // Check accuracy
  if (location.accuracy > requiredAccuracy) {
    return {
      valid: false,
      location,
      distance: 0,
      message: `GPS accuracy too low (${Math.round(location.accuracy)}m). Please try again.`,
    };
  }

  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    patientLocation.latitude,
    patientLocation.longitude,
  );

  const isValid = isWithinGeofence(location, patientLocation);

  return {
    valid: isValid,
    location,
    distance: Math.round(distance),
    message: isValid
      ? 'Location verified'
      : `Location is ${Math.round(distance)}m from patient's home`,
  };
}

/**
 * Format location for display
 */
export function formatLocation(location: LocationData): string {
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

/**
 * Get location error message
 */
function getLocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied. Please enable location access.';
    case error.POSITION_UNAVAILABLE:
      return 'Location unavailable. Please check GPS settings.';
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'Unknown location error';
  }
}
