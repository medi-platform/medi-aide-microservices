import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '@medi-aide/kafka-client';
import { KafkaTopics } from '@medi-aide/event-contracts';

/**
 * Scheduling Event Publisher
 * 
 * Publishes scheduling-related events to Kafka topics using
 * the @medi-aide/event-contracts schemas.
 */
@Injectable()
export class SchedulingEventPublisher {
  private readonly logger = new Logger(SchedulingEventPublisher.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  /**
   * Publish when a new schedule is created
   */
  async publishScheduleCreated(data: {
    scheduleId: string;
    patientId: string;
    caregiverId: string;
    startDate: string;
    endDate: string;
    frequency: string;
    createdBy: string;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        KafkaTopics.SCHEDULING,
        'schedule.created',
        data,
        { key: data.scheduleId },
      );
      this.logger.log(`Published schedule.created event for ${data.scheduleId}`);
    } catch (error) {
      this.logger.error(`Failed to publish schedule.created event`, error);
      throw error;
    }
  }

  /**
   * Publish when a shift is assigned
   */
  async publishShiftAssigned(data: {
    shiftId: string;
    scheduleId: string;
    caregiverId: string;
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    assignedAt: string;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        KafkaTopics.SCHEDULING,
        'shift.assigned',
        data,
        { key: data.shiftId },
      );
      this.logger.log(`Published shift.assigned event for ${data.shiftId}`);
    } catch (error) {
      this.logger.error(`Failed to publish shift.assigned event`, error);
      throw error;
    }
  }

  /**
   * Publish when a shift is started (clock-in)
   */
  async publishShiftStarted(data: {
    shiftId: string;
    caregiverId: string;
    patientId: string;
    clockInTime: string;
    location: { lat: number; lng: number };
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        KafkaTopics.SCHEDULING,
        'shift.started',
        data,
        { key: data.shiftId },
      );
      this.logger.log(`Published shift.started event for ${data.shiftId}`);
    } catch (error) {
      this.logger.error(`Failed to publish shift.started event`, error);
      throw error;
    }
  }

  /**
   * Publish when a shift is completed (clock-out)
   */
  async publishShiftCompleted(data: {
    shiftId: string;
    caregiverId: string;
    patientId: string;
    clockOutTime: string;
    durationMinutes: number;
    tasksCompleted: string[];
    notes?: string;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        KafkaTopics.SCHEDULING,
        'shift.completed',
        data,
        { key: data.shiftId },
      );
      this.logger.log(`Published shift.completed event for ${data.shiftId}`);
    } catch (error) {
      this.logger.error(`Failed to publish shift.completed event`, error);
      throw error;
    }
  }

  /**
   * Publish when a shift is cancelled
   */
  async publishShiftCancelled(data: {
    shiftId: string;
    caregiverId: string;
    patientId: string;
    reason: string;
    cancelledBy: string;
    cancelledAt: string;
    replacementNeeded: boolean;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        KafkaTopics.SCHEDULING,
        'shift.cancelled',
        data,
        { key: data.shiftId },
      );
      this.logger.log(`Published shift.cancelled event for ${data.shiftId}`);
    } catch (error) {
      this.logger.error(`Failed to publish shift.cancelled event`, error);
      throw error;
    }
  }
}

