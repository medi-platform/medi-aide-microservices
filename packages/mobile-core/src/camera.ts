/**
 * Camera Module
 * Photo capture for documentation and EVV
 */

export interface CameraConfig {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
}

export interface CapturedImage {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

const DEFAULT_CONFIG: CameraConfig = {
  facingMode: 'environment',
  width: 1280,
  height: 720,
  quality: 0.85,
};

/**
 * Check if camera is available
 */
export function isCameraAvailable(): boolean {
  return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<PermissionState> {
  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state;
  } catch {
    // Try to access camera directly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      return 'granted';
    } catch {
      return 'denied';
    }
  }
}

/**
 * Get available cameras
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'videoinput');
}

/**
 * Open camera stream
 */
export async function openCamera(config: CameraConfig = {}): Promise<MediaStream> {
  const opts = { ...DEFAULT_CONFIG, ...config };

  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: opts.facingMode,
      width: { ideal: opts.width },
      height: { ideal: opts.height },
    },
    audio: false,
  };

  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Close camera stream
 */
export function closeCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Capture photo from video element
 */
export async function capturePhoto(
  videoElement: HTMLVideoElement,
  config: CameraConfig = {},
): Promise<CapturedImage> {
  const opts = { ...DEFAULT_CONFIG, ...config };

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(videoElement, 0, 0);

  // Get location if available
  let location: { latitude: number; longitude: number } | undefined;
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    // Location not available
  }

  const dataUrl = canvas.toDataURL('image/jpeg', opts.quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', opts.quality);
  });

  return {
    dataUrl,
    blob,
    width: canvas.width,
    height: canvas.height,
    timestamp: Date.now(),
    location,
  };
}

/**
 * Compress image
 */
export async function compressImage(
  file: File | Blob,
  maxWidth: number = 1280,
  quality: number = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Add watermark to image (for EVV verification)
 */
export async function addWatermark(
  imageBlob: Blob,
  text: string,
  timestamp: Date = new Date(),
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, img.height - 60, img.width, 60);

      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(text, 10, img.height - 35);
      ctx.fillText(timestamp.toLocaleString(), 10, img.height - 10);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to add watermark'));
          }
        },
        'image/jpeg',
        0.9,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

/**
 * Convert file to data URL
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Pick image from gallery
 */
export function pickImage(accept: string = 'image/*'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.capture = 'environment';

    input.onchange = () => {
      const file = input.files?.[0] || null;
      resolve(file);
    };

    input.click();
  });
}
