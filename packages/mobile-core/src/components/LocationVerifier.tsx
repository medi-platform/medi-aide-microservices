import React, { useState, useCallback } from 'react';
import { validateEVVLocation, GeofenceConfig, LocationData } from '../location';

interface LocationVerifierProps {
  patientLocation: GeofenceConfig;
  onVerified: (location: LocationData) => void;
  onFailed?: (error: string) => void;
  requiredAccuracy?: number;
  className?: string;
}

/**
 * EVV Location verification component
 */
export function LocationVerifier({
  patientLocation,
  onVerified,
  onFailed,
  requiredAccuracy = 50,
  className = '',
}: LocationVerifierProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);

  const handleVerify = useCallback(async () => {
    setStatus('verifying');
    setMessage('Getting your location...');

    try {
      const result = await validateEVVLocation(patientLocation, requiredAccuracy);
      setLocation(result.location);
      setMessage(result.message);

      if (result.valid) {
        setStatus('success');
        onVerified(result.location);
      } else {
        setStatus('failed');
        onFailed?.(result.message);
      }
    } catch (error: any) {
      setStatus('failed');
      setMessage(error.message);
      onFailed?.(error.message);
    }
  }, [patientLocation, requiredAccuracy, onVerified, onFailed]);

  return (
    <div className={`p-4 ${className}`}>
      <div className="text-center">
        {status === 'idle' && (
          <>
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-semibold mb-2">Verify Your Location</h3>
            <p className="text-gray-600 mb-4">
              We need to verify you're at the patient's location for EVV compliance.
            </p>
            <button
              onClick={handleVerify}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
            >
              Verify Location
            </button>
          </>
        )}

        {status === 'verifying' && (
          <>
            <div className="animate-pulse text-4xl mb-4">📡</div>
            <p className="text-gray-600">{message}</p>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 animate-progress" />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl mb-4 text-green-600">✓</div>
            <h3 className="text-lg font-semibold mb-2 text-green-600">Location Verified</h3>
            <p className="text-gray-600 mb-4">{message}</p>
            {location && (
              <div className="text-sm text-gray-500">
                Accuracy: ±{Math.round(location.accuracy)}m
              </div>
            )}
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="text-4xl mb-4 text-red-600">✗</div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">Verification Failed</h3>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={handleVerify}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
            {location && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Your location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 90%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
