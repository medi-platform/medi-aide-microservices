/**
 * Stage 3 Feature Flags Configuration
 * 
 * Controls gradual migration from monolith to microservices
 */

export interface ServiceFeatureFlag {
  enabled: boolean;
  trafficPercentage: number;
  canaryHeader?: string;
  shadowRoute?: string;
  rolloutPhase: 'shadow' | 'canary' | 'gradual' | 'full';
}

export interface Stage3FeatureFlags {
  services: {
    notification: ServiceFeatureFlag;
    auth: ServiceFeatureFlag;
    user: ServiceFeatureFlag;
    visit: ServiceFeatureFlag;
    wellness: ServiceFeatureFlag;
    payment: ServiceFeatureFlag;
    analytics: ServiceFeatureFlag;
    audit: ServiceFeatureFlag;
    ai: ServiceFeatureFlag;
    carePlan: ServiceFeatureFlag;
    evv: ServiceFeatureFlag;
    file: ServiceFeatureFlag;
    search: ServiceFeatureFlag;
    matching: ServiceFeatureFlag;
    training: ServiceFeatureFlag;
    feedback: ServiceFeatureFlag;
    communication: ServiceFeatureFlag;
  };
  globalSettings: {
    enableDistributedTracing: boolean;
    enableInstantRollback: boolean;
    rollbackTimeoutSeconds: number;
    enableMetricsCollection: boolean;
  };
}

// Default configuration (all services disabled, 100% monolith traffic)
export const defaultStage3Flags: Stage3FeatureFlags = {
  services: {
    notification: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Notifications',
      shadowRoute: '/stage3/api/v1/notifications',
      rolloutPhase: 'shadow'
    },
    auth: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Auth',
      rolloutPhase: 'shadow'
    },
    user: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-User',
      rolloutPhase: 'shadow'
    },
    visit: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Visit',
      rolloutPhase: 'shadow'
    },
    wellness: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Wellness',
      rolloutPhase: 'shadow'
    },
    payment: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Payment',
      rolloutPhase: 'shadow'
    },
    analytics: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Analytics',
      rolloutPhase: 'shadow'
    },
    audit: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Audit',
      rolloutPhase: 'shadow'
    },
    ai: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-AI',
      rolloutPhase: 'shadow'
    },
    carePlan: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-CarePlan',
      rolloutPhase: 'shadow'
    },
    evv: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-EVV',
      rolloutPhase: 'shadow'
    },
    file: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-File',
      rolloutPhase: 'shadow'
    },
    search: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Search',
      rolloutPhase: 'shadow'
    },
    matching: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Matching',
      rolloutPhase: 'shadow'
    },
    training: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Training',
      rolloutPhase: 'shadow'
    },
    feedback: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Feedback',
      rolloutPhase: 'shadow'
    },
    communication: {
      enabled: false,
      trafficPercentage: 0,
      canaryHeader: 'X-Canary-Communication',
      rolloutPhase: 'shadow'
    }
  },
  globalSettings: {
    enableDistributedTracing: true,
    enableInstantRollback: true,
    rollbackTimeoutSeconds: 10,
    enableMetricsCollection: true
  }
};

/**
 * Migration phases:
 * 1. Shadow: Service runs in parallel, accessible via /stage3/* routes only
 * 2. Canary: Service accessible via header-based routing (X-Canary-*)
 * 3. Gradual: Percentage-based traffic splitting
 * 4. Full: 100% traffic to new service
 */
export type RolloutPhase = Stage3FeatureFlags['services'][keyof Stage3FeatureFlags['services']]['rolloutPhase'];

/**
 * Helper to check if a service should handle a request
 */
export function shouldRouteToNewService(
  serviceName: keyof Stage3FeatureFlags['services'],
  headers: Record<string, string>,
  flags: Stage3FeatureFlags = defaultStage3Flags
): boolean {
  const serviceFlag = flags.services[serviceName];
  
  if (!serviceFlag.enabled) {
    return false;
  }

  // Check canary header
  if (serviceFlag.canaryHeader && headers[serviceFlag.canaryHeader] === '1') {
    return true;
  }

  // Check traffic percentage (would need actual implementation)
  // This is a simplified version
  if (serviceFlag.rolloutPhase === 'gradual' || serviceFlag.rolloutPhase === 'full') {
    return Math.random() * 100 < serviceFlag.trafficPercentage;
  }

  return false;
}
