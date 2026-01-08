import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../entities/task.entity';
import { SchedulingEventPublisher } from './scheduling-event-publisher.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateTaskDto {
  scheduleId?: string;
  appointmentId?: string;
  visitId?: string;
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedTo?: string;
  dueAt?: Date;
  estimatedDurationMinutes?: number;
  checklist?: { text: string }[];
  dependsOn?: string[];
}

interface UpdateTaskDto {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedTo?: string;
  dueAt?: Date;
  estimatedDurationMinutes?: number;
}

interface TaskNote {
  text: string;
  authorId: string;
}

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly eventPublisher: SchedulingEventPublisher,
  ) {}

  /**
   * Create a new task
   */
  async createTask(dto: CreateTaskDto): Promise<Task> {
    const checklist = dto.checklist?.map(item => ({
      id: uuidv4(),
      text: item.text,
      completed: false,
    }));

    const task = this.taskRepo.create({
      ...dto,
      status: TaskStatus.PENDING,
      priority: dto.priority || TaskPriority.MEDIUM,
      category: dto.category || TaskCategory.OTHER,
      checklist,
    });

    await this.taskRepo.save(task);

    await this.eventPublisher.publishTaskCreated(task);

    this.logger.log(`Task created: ${task.id}`);

    return task;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return task;
  }

  /**
   * Get tasks for a schedule
   */
  async getScheduleTasks(scheduleId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { scheduleId },
      order: { dueAt: 'ASC', priority: 'ASC' },
    });
  }

  /**
   * Get tasks for an appointment
   */
  async getAppointmentTasks(appointmentId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { appointmentId },
      order: { priority: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Get tasks assigned to a user
   */
  async getAssignedTasks(
    userId: string,
    options?: {
      status?: TaskStatus;
      dueBy?: Date;
    },
  ): Promise<Task[]> {
    const where: any = { assignedTo: userId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.dueBy) {
      where.dueAt = LessThanOrEqual(options.dueBy);
    }

    return this.taskRepo.find({
      where,
      order: { dueAt: 'ASC', priority: 'ASC' },
    });
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.getTask(taskId);

    Object.assign(task, dto);
    await this.taskRepo.save(task);

    this.logger.log(`Task updated: ${taskId}`);

    return task;
  }

  /**
   * Start a task
   */
  async startTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTask(taskId);

    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException(`Cannot start task in status: ${task.status}`);
    }

    // Check dependencies
    if (task.dependsOn && task.dependsOn.length > 0) {
      const dependencies = await this.taskRepo.find({
        where: { id: In(task.dependsOn) },
      });

      const incomplete = dependencies.filter(d => d.status !== TaskStatus.COMPLETED);
      if (incomplete.length > 0) {
        throw new BadRequestException('Cannot start task: dependencies not completed');
      }
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();

    await this.taskRepo.save(task);

    await this.eventPublisher.publishTaskStarted(task);

    return task;
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTask(taskId);

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Task is already completed');
    }

    // Calculate actual duration
    if (task.startedAt) {
      const now = new Date();
      task.actualDurationMinutes = Math.round(
        (now.getTime() - task.startedAt.getTime()) / 60000,
      );
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.completedBy = userId;

    // Mark all checklist items as completed
    if (task.checklist) {
      task.checklist = task.checklist.map(item => ({
        ...item,
        completed: true,
        completedAt: item.completedAt || new Date(),
      }));
    }

    await this.taskRepo.save(task);

    await this.eventPublisher.publishTaskCompleted(task);

    this.logger.log(`Task completed: ${taskId}`);

    return task;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string, reason?: string): Promise<Task> {
    const task = await this.getTask(taskId);

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed task');
    }

    task.status = TaskStatus.CANCELLED;
    task.metadata = { ...task.metadata, cancelReason: reason };

    await this.taskRepo.save(task);

    return task;
  }

  /**
   * Update checklist item
   */
  async updateChecklistItem(
    taskId: string,
    itemId: string,
    completed: boolean,
  ): Promise<Task> {
    const task = await this.getTask(taskId);

    if (!task.checklist) {
      throw new BadRequestException('Task has no checklist');
    }

    const itemIndex = task.checklist.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException(`Checklist item ${itemId} not found`);
    }

    task.checklist[itemIndex].completed = completed;
    if (completed) {
      task.checklist[itemIndex].completedAt = new Date();
    }

    await this.taskRepo.save(task);

    return task;
  }

  /**
   * Add note to task
   */
  async addNote(taskId: string, note: TaskNote): Promise<Task> {
    const task = await this.getTask(taskId);

    const notes = task.notes || [];
    notes.push({
      id: uuidv4(),
      text: note.text,
      authorId: note.authorId,
      createdAt: new Date(),
    });

    task.notes = notes;
    await this.taskRepo.save(task);

    return task;
  }

  /**
   * Add checklist item
   */
  async addChecklistItem(taskId: string, text: string): Promise<Task> {
    const task = await this.getTask(taskId);

    const checklist = task.checklist || [];
    checklist.push({
      id: uuidv4(),
      text,
      completed: false,
    });

    task.checklist = checklist;
    await this.taskRepo.save(task);

    return task;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);

    if (task.status === TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete an in-progress task');
    }

    await this.taskRepo.remove(task);

    this.logger.log(`Task deleted: ${taskId}`);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    return this.taskRepo.find({
      where: {
        status: In([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        dueAt: LessThanOrEqual(new Date()),
      },
      order: { dueAt: 'ASC' },
    });
  }

  /**
   * Get task statistics
   */
  async getTaskStats(scheduleId?: string): Promise<{
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
    overdue: number;
    completionRate: number;
  }> {
    const where: any = {};
    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    const tasks = await this.taskRepo.find({ where });

    const byStatus = {} as Record<TaskStatus, number>;
    const byPriority = {} as Record<TaskPriority, number>;
    let completedCount = 0;
    let overdueCount = 0;
    const now = new Date();

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;

      if (task.status === TaskStatus.COMPLETED) {
        completedCount++;
      }

      if (
        task.dueAt &&
        task.dueAt < now &&
        task.status !== TaskStatus.COMPLETED &&
        task.status !== TaskStatus.CANCELLED
      ) {
        overdueCount++;
      }
    }

    return {
      total: tasks.length,
      byStatus,
      byPriority,
      overdue: overdueCount,
      completionRate: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
    };
  }
}

