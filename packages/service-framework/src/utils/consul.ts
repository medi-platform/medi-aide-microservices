import axios from 'axios';

export interface ConsulConfig {
  host: string;
  port: number;
  serviceName: string;
  servicePort: number;
  healthCheckPath?: string;
  healthCheckInterval?: string;
}

export class ConsulService {
  private consulUrl: string;

  constructor(private config: ConsulConfig) {
    this.consulUrl = `http://${config.host}:${config.port}`;
  }

  async register() {
    const serviceId = `${this.config.serviceName}-${process.env.HOSTNAME || 'local'}`;
    
    try {
      await axios.put(
        `${this.consulUrl}/v1/agent/service/register`,
        {
          ID: serviceId,
          Name: this.config.serviceName,
          Port: this.config.servicePort,
          Check: {
            HTTP: `http://localhost:${this.config.servicePort}${this.config.healthCheckPath || '/health'}`,
            Interval: this.config.healthCheckInterval || '10s',
          },
          Tags: [
            'stage3',
            process.env.NODE_ENV || 'development',
            `version:${process.env.SERVICE_VERSION || '1.0.0'}`,
          ],
        }
      );
      
      console.log(`✅ Registered ${serviceId} with Consul`);
    } catch (error) {
      console.error('Failed to register with Consul:', error);
    }
  }

  async deregister() {
    const serviceId = `${this.config.serviceName}-${process.env.HOSTNAME || 'local'}`;
    
    try {
      await axios.put(`${this.consulUrl}/v1/agent/service/deregister/${serviceId}`);
      console.log(`✅ Deregistered ${serviceId} from Consul`);
    } catch (error) {
      console.error('Failed to deregister from Consul:', error);
    }
  }
}
