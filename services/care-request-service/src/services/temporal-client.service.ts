import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Client, WorkflowHandle } from '@temporalio/client';

/**
 * Temporal Client Service
 * 
 * Provides integration with Temporal for workflow orchestration.
 * Used to start and signal the care-request workflow.
 */
@Injectable()
export class TemporalClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalClientService.name);
  private connection: Connection | null = null;
  private client: Client | null = null;
  private readonly taskQueue = 'medi-aide-care-workflows';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      const temporalAddress = this.config.get('TEMPORAL_ADDRESS', 'temporal:7233');
      
      this.connection = await Connection.connect({
        address: temporalAddress,
      });
      
      this.client = new Client({
        connection: this.connection,
        namespace: this.config.get('TEMPORAL_NAMESPACE', 'default'),
      });
      
      this.logger.log(`Connected to Temporal at ${temporalAddress}`);
    } catch (error) {
      this.logger.warn('Failed to connect to Temporal - workflow features disabled', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.close();
  }

  /**
   * Start a care request workflow
   */
  async startCareRequestWorkflow(input: {
    requestId: string;
    patientId: string;
    requirements: {
      skills: string[];
      languages: string[];
      startDate: string;
      frequency: string;
      duration: number;
    };
    urgency: 'urgent' | 'normal' | 'flexible';
  }): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Temporal client not available - workflow not started');
      return null;
    }

    try {
      const handle = await this.client.workflow.start('careRequestWorkflow', {
        taskQueue: this.taskQueue,
        workflowId: `care-request-${input.requestId}`,
        args: [input],
      });

      this.logger.log(`Started care request workflow: ${handle.workflowId}`);
      return handle.workflowId;
    } catch (error) {
      this.logger.error('Failed to start care request workflow', error);
      throw error;
    }
  }

  /**
   * Signal caregiver acceptance
   */
  async signalCaregiverAcceptance(
    requestId: string,
    caregiverId: string,
  ): Promise<void> {
    if (!this.client) {
      this.logger.warn('Temporal client not available');
      return;
    }

    try {
      const handle = this.client.workflow.getHandle(`care-request-${requestId}`);
      await handle.signal('acceptRequest', requestId, caregiverId);
      this.logger.log(`Signaled acceptance for request ${requestId} by caregiver ${caregiverId}`);
    } catch (error) {
      this.logger.error('Failed to signal caregiver acceptance', error);
      throw error;
    }
  }

  /**
   * Signal caregiver decline
   */
  async signalCaregiverDecline(
    requestId: string,
    caregiverId: string,
  ): Promise<void> {
    if (!this.client) {
      this.logger.warn('Temporal client not available');
      return;
    }

    try {
      const handle = this.client.workflow.getHandle(`care-request-${requestId}`);
      await handle.signal('declineRequest', requestId, caregiverId);
      this.logger.log(`Signaled decline for request ${requestId} by caregiver ${caregiverId}`);
    } catch (error) {
      this.logger.error('Failed to signal caregiver decline', error);
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(requestId: string): Promise<any> {
    if (!this.client) {
      return { status: 'temporal_unavailable' };
    }

    try {
      const handle = this.client.workflow.getHandle(`care-request-${requestId}`);
      const description = await handle.describe();
      return {
        workflowId: description.workflowId,
        status: description.status.name,
        startTime: description.startTime,
        closeTime: description.closeTime,
      };
    } catch (error) {
      return { status: 'not_found' };
    }
  }

  /**
   * Check if Temporal is healthy
   */
  isHealthy(): boolean {
    return this.client !== null;
  }
}

