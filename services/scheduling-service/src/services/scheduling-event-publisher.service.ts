import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '@medi-aide/kafka-client';
import { KAFKA_TOPICS } from '@medi-aide/event-contracts';

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
        'medi-aide.scheduling',
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
        'medi-aide.scheduling',
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
        'medi-aide.scheduling',
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
        'medi-aide.scheduling',
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
        'medi-aide.scheduling',
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

  /**
   * Publish when availability is created
   */
  async publishAvailabilityCreated(data: {
    id: string;
    caregiverId: string;
    startTime: Date;
    endTime: Date;
    [key: string]: any;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        'medi-aide.scheduling',
        'availability.created',
        data,
        { key: data.id },
      );
      this.logger.log(`Published availability.created event for ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish availability.created event`, error);
      throw error;
    }
  }

  /**
   * Publish when a slot is reserved
   */
  async publishSlotReserved(data: {
    slotId: string;
    caregiverId: string;
    visitId: string;
    startTime: Date;
    endTime: Date;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        'medi-aide.scheduling',
        'slot.reserved',
        data,
        { key: data.slotId },
      );
      this.logger.log(`Published slot.reserved event for ${data.slotId}`);
    } catch (error) {
      this.logger.error(`Failed to publish slot.reserved event`, error);
      throw error;
    }
  }

  /**
   * Publish when a slot is released
   */
  async publishSlotReleased(data: {
    slotId: string;
    caregiverId: string;
    visitId: string;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        'medi-aide.scheduling',
        'slot.released',
        data,
        { key: data.slotId },
      );
      this.logger.log(`Published slot.released event for ${data.slotId}`);
    } catch (error) {
      this.logger.error(`Failed to publish slot.released event`, error);
      throw error;
    }
  }

  /**
   * Publish when a task is created
   */
  async publishTaskCreated(data: {
    id: string;
    title: string;
    [key: string]: any;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        'medi-aide.scheduling',
        'task.created',
        data,
        { key: data.id },
      );
      this.logger.log(`Published task.created event for ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish task.created event`, error);
      throw error;
    }
  }

  /**
   * Publish when a task is started
   */
  async publishTaskStarted(data: {
    id: string;
    [key: string]: any;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        'medi-aide.scheduling',
        'task.started',
        data,
        { key: data.id },
      );
      this.logger.log(`Published task.started event for ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish task.started event`, error);
      throw error;
    }
  }

  /**
   * Publish when a task is completed
   */
  async publishTaskCompleted(data: {
    id: string;
    [key: string]: any;
  }): Promise<void> {
    try {
      await this.kafkaProducer.publish(
        'medi-aide.scheduling',
        'task.completed',
        data,
        { key: data.id },
      );
      this.logger.log(`Published task.completed event for ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to publish task.completed event`, error);
      throw error;
    }
  }
}

