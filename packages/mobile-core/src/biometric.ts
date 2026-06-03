/**
 * Biometric Authentication Module
 * WebAuthn-based biometric authentication
 */

export interface BiometricCredential {
  id: string;
  type: 'fingerprint' | 'face' | 'iris' | 'unknown';
  createdAt: string;
  lastUsedAt?: string;
}

export interface BiometricConfig {
  rpId: string; // Relying Party ID (domain)
  rpName: string; // Relying Party Name
  userId: string;
  userName: string;
  userDisplayName: string;
  timeout?: number;
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Check if WebAuthn is supported
 */
export function isWebAuthnSupported(): boolean {
  return 'credentials' in navigator && 'PublicKeyCredential' in window;
}

/**
 * Get available authenticator types
 */
export async function getAuthenticatorTypes(): Promise<string[]> {
  const types: string[] = [];

  if (await isBiometricAvailable()) {
    types.push('platform');
  }

  // Check for security key support
  if (isWebAuthnSupported()) {
    types.push('cross-platform');
  }

  return types;
}

/**
 * Register biometric credential
 */
export async function registerBiometric(
  config: BiometricConfig,
  challenge: ArrayBuffer,
): Promise<PublicKeyCredential | null> {
  if (!await isBiometricAvailable()) {
    throw new Error('Biometric authentication not available on this device');
  }

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: config.rpName,
      id: config.rpId,
    },
    user: {
      id: Uint8Array.from(config.userId, (c) => c.charCodeAt(0)),
      name: config.userName,
      displayName: config.userDisplayName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: config.timeout || 60000,
    attestation: 'none',
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    return credential as PublicKeyCredential;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric registration was cancelled or denied');
    }
    throw error;
  }
}

/**
 * Authenticate with biometric
 */
export async function authenticateWithBiometric(
  config: Pick<BiometricConfig, 'rpId' | 'timeout'>,
  challenge: ArrayBuffer,
  allowCredentials?: PublicKeyCredentialDescriptor[],
): Promise<PublicKeyCredential | null> {
  if (!await isBiometricAvailable()) {
    throw new Error('Biometric authentication not available on this device');
  }

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: config.rpId,
    userVerification: 'required',
    timeout: config.timeout || 60000,
    allowCredentials,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    return assertion as PublicKeyCredential;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled or denied');
    }
    throw error;
  }
}

/**
 * Store credential ID locally
 */
export function storeCredentialId(userId: string, credentialId: string): void {
  const credentials = getStoredCredentials();
  credentials[userId] = {
    credentialId,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem('biometric-credentials', JSON.stringify(credentials));
}

/**
 * Get stored credential for user
 */
export function getStoredCredential(userId: string): { credentialId: string; createdAt: string } | null {
  const credentials = getStoredCredentials();
  return credentials[userId] || null;
}

/**
 * Remove stored credential
 */
export function removeStoredCredential(userId: string): void {
  const credentials = getStoredCredentials();
  delete credentials[userId];
  localStorage.setItem('biometric-credentials', JSON.stringify(credentials));
}

/**
 * Check if user has biometric enrolled
 */
export function hasBiometricEnrolled(userId: string): boolean {
  return getStoredCredential(userId) !== null;
}

/**
 * Get all stored credentials
 */
function getStoredCredentials(): Record<string, { credentialId: string; createdAt: string }> {
  try {
    return JSON.parse(localStorage.getItem('biometric-credentials') || '{}');
  } catch {
    return {};
  }
}

/**
 * Convert credential response to base64 for API
 */
export function credentialToBase64(credential: PublicKeyCredential): {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject?: string;
    authenticatorData?: string;
    signature?: string;
    userHandle?: string;
  };
  type: string;
} {
  const response = credential.response as AuthenticatorAttestationResponse & AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64(credential.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
      attestationObject: response.attestationObject
        ? arrayBufferToBase64(response.attestationObject)
        : undefined,
      authenticatorData: response.authenticatorData
        ? arrayBufferToBase64(response.authenticatorData)
        : undefined,
      signature: response.signature
        ? arrayBufferToBase64(response.signature)
        : undefined,
      userHandle: response.userHandle
        ? arrayBufferToBase64(response.userHandle)
        : undefined,
    },
    type: credential.type,
  };
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
