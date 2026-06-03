import React, { useState, useCallback } from 'react';
import { useBiometric } from '../hooks';
import {
  isBiometricAvailable,
  registerBiometric,
  authenticateWithBiometric,
  storeCredentialId,
  getStoredCredential,
  credentialToBase64,
  base64ToArrayBuffer,
} from '../biometric';

interface BiometricPromptProps {
  userId: string;
  userName: string;
  userDisplayName: string;
  rpId: string;
  rpName: string;
  onSuccess: (credential: any) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  mode?: 'authenticate' | 'register';
  className?: string;
}

/**
 * Biometric authentication prompt component
 */
export function BiometricPrompt({
  userId,
  userName,
  userDisplayName,
  rpId,
  rpName,
  onSuccess,
  onCancel,
  onError,
  mode = 'authenticate',
  className = '',
}: BiometricPromptProps) {
  const { available, enrolled, loading } = useBiometric(userId);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = useCallback(async () => {
    setStatus('processing');
    setError(null);

    try {
      // Get challenge from server (mock for now)
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const storedCredential = getStoredCredential(userId);
      const allowCredentials = storedCredential
        ? [
            {
              id: base64ToArrayBuffer(storedCredential.credentialId),
              type: 'public-key' as const,
            },
          ]
        : undefined;

      const credential = await authenticateWithBiometric(
        { rpId },
        challenge.buffer,
        allowCredentials,
      );

      if (credential) {
        setStatus('success');
        onSuccess(credentialToBase64(credential));
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
      onError?.(err);
    }
  }, [userId, rpId, onSuccess, onError]);

  const handleRegister = useCallback(async () => {
    setStatus('processing');
    setError(null);

    try {
      // Get challenge from server (mock for now)
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const credential = await registerBiometric(
        {
          rpId,
          rpName,
          userId,
          userName,
          userDisplayName,
        },
        challenge.buffer,
      );

      if (credential) {
        storeCredentialId(userId, credential.id);
        setStatus('success');
        onSuccess(credentialToBase64(credential));
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
      onError?.(err);
    }
  }, [userId, userName, userDisplayName, rpId, rpName, onSuccess, onError]);

  if (loading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <p className="text-gray-600">Checking biometric availability...</p>
      </div>
    );
  }

  if (!available) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-semibold mb-2">Biometric Not Available</h3>
        <p className="text-gray-600 mb-4">
          Your device doesn't support biometric authentication.
        </p>
        <button
          onClick={onCancel}
          className="text-blue-600 font-medium"
        >
          Use Password Instead
        </button>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="text-center">
        {status === 'idle' && (
          <>
            <div className="text-6xl mb-4">👆</div>
            <h3 className="text-xl font-semibold mb-2">
              {mode === 'register' ? 'Set Up Biometric Login' : 'Biometric Login'}
            </h3>
            <p className="text-gray-600 mb-6">
              {mode === 'register'
                ? 'Use your fingerprint or face to quickly sign in.'
                : 'Use your fingerprint or face to continue.'}
            </p>

            <button
              onClick={mode === 'register' ? handleRegister : handleAuthenticate}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-3"
            >
              <span className="text-2xl">🔐</span>
              <span>{mode === 'register' ? 'Enable Biometrics' : 'Authenticate'}</span>
            </button>

            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-4 text-gray-600 font-medium"
              >
                Cancel
              </button>
            )}
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="text-6xl mb-4 animate-pulse">👆</div>
            <h3 className="text-xl font-semibold mb-2">
              {mode === 'register' ? 'Place Your Finger...' : 'Authenticating...'}
            </h3>
            <p className="text-gray-600">
              Follow the prompts on your device.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4 text-green-600">✓</div>
            <h3 className="text-xl font-semibold mb-2 text-green-600">
              {mode === 'register' ? 'Biometrics Enabled!' : 'Authenticated!'}
            </h3>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4 text-red-600">✗</div>
            <h3 className="text-xl font-semibold mb-2 text-red-600">
              Authentication Failed
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={mode === 'register' ? handleRegister : handleAuthenticate}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="mt-4 text-gray-600 font-medium block w-full"
              >
                Use Password Instead
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
