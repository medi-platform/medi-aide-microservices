import React, { useState, useRef, useCallback, useEffect } from 'react';
import { openCamera, closeCamera, capturePhoto, CapturedImage, addWatermark } from '../camera';

interface CameraCaptureProps {
  onCapture: (image: CapturedImage) => void;
  onCancel?: () => void;
  watermark?: string;
  facingMode?: 'user' | 'environment';
  showPreview?: boolean;
  className?: string;
}

/**
 * Camera capture component for documentation
 */
export function CameraCapture({
  onCapture,
  onCancel,
  watermark,
  facingMode = 'environment',
  showPreview = true,
  className = '',
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Open camera on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const mediaStream = await openCamera({ facingMode });
        if (mounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (stream) {
        closeCamera(stream);
      }
    };
  }, [facingMode]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      let image = await capturePhoto(videoRef.current);

      if (watermark) {
        const watermarkedBlob = await addWatermark(image.blob, watermark);
        image = {
          ...image,
          blob: watermarkedBlob,
          dataUrl: URL.createObjectURL(watermarkedBlob),
        };
      }

      if (showPreview) {
        setCaptured(image);
      } else {
        onCapture(image);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [watermark, showPreview, onCapture]);

  const handleRetake = useCallback(() => {
    if (captured) {
      URL.revokeObjectURL(captured.dataUrl);
    }
    setCaptured(null);
  }, [captured]);

  const handleConfirm = useCallback(() => {
    if (captured) {
      onCapture(captured);
    }
  }, [captured, onCapture]);

  const handleCancel = useCallback(() => {
    if (stream) {
      closeCamera(stream);
    }
    onCancel?.();
  }, [stream, onCancel]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-black min-h-[400px] ${className}`}>
        <div className="text-white text-center">
          <div className="text-4xl mb-4 animate-pulse">📸</div>
          <p>Opening camera...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black min-h-[400px] ${className}`}>
        <div className="text-white text-center p-6">
          <div className="text-4xl mb-4">❌</div>
          <p className="mb-4">{error}</p>
          <button
            onClick={handleCancel}
            className="bg-white text-black py-2 px-6 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Camera view or captured image */}
      {captured ? (
        <img
          src={captured.dataUrl}
          alt="Captured"
          className="w-full h-auto"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
        />
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {captured ? (
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetake}
              className="flex-1 bg-white/20 text-white py-3 px-6 rounded-full font-medium backdrop-blur-sm"
            >
              ↩️ Retake
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-full font-medium"
            >
              ✓ Use Photo
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-8">
            {onCancel && (
              <button
                onClick={handleCancel}
                className="text-white/80 text-lg"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleCapture}
              className="w-20 h-20 bg-white rounded-full border-4 border-white/50 shadow-lg flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-white rounded-full" />
            </button>
            <div className="w-16" /> {/* Spacer */}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
