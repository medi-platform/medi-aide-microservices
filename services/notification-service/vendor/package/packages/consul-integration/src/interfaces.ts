export interface ServiceInstance {
  id: string;
  name: string;
  address: string;
  port: number;
  tags: string[];
  meta: Record<string, string>;
  health: 'passing' | 'warning' | 'critical';
}

export interface ServiceDiscoveryOptions {
  serviceName: string;
  loadBalancer?: 'round-robin' | 'random' | 'least-connections';
  healthCheck?: {
    enabled: boolean;
    interval?: number;
    timeout?: number;
  };
  retry?: {
    maxAttempts: number;
    delay: number;
    backoff: 'linear' | 'exponential';
  };
}

export interface ConsulWatchEvent {
  type: 'added' | 'updated' | 'removed';
  service: ServiceInstance;
  timestamp: Date;
}

export interface ConsulKVPair {
  key: string;
  value: any;
  flags?: number;
  createIndex?: number;
  modifyIndex?: number;
  lockIndex?: number;
  session?: string;
}
