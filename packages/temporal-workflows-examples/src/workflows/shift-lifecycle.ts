/**
 * Shift Lifecycle Workflow
 * 
 * Manages the complete lifecycle of a care shift:
 * 1. Pre-shift verification
 * 2. Clock-in monitoring
 * 3. Shift progress tracking
 * 4. Clock-out processing
 * 5. Post-shift verification (EVV)
 */

import { proxyActivities, sleep, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type * as activities from '../activities';

const {
  verifyShiftRequirements,
  sendShiftReminder,
  recordClockIn,
  recordClockOut,
  verifyEVV,
  processShiftCompletion,
  notifyNoShow,
  escalateToSupervisor,
  calculateShiftMetrics,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
});

export const clockInSignal = defineSignal<[ClockInData]>('clockIn');
export const clockOutSignal = defineSignal<[ClockOutData]>('clockOut');
export const cancelShiftSignal = defineSignal<[string]>('cancelShift');

interface ClockInData {
  timestamp: string;
  latitude: number;
  longitude: number;
  verificationMethod: 'gps' | 'qr' | 'biometric';
}

interface ClockOutData {
  timestamp: string;
  latitude: number;
  longitude: number;
  tasksCompleted: string[];
  notes?: string;
}

export interface ShiftLifecycleInput {
  shiftId: string;
  caregiverId: string;
  patientId: string;
  scheduledStart: string;
  scheduledEnd: string;
  patientLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface ShiftLifecycleResult {
  shiftId: string;
  status: 'completed' | 'no_show' | 'cancelled' | 'partial';
  actualStart?: string;
  actualEnd?: string;
  durationMinutes?: number;
  evvVerified: boolean;
  metrics?: ShiftMetrics;
}

interface ShiftMetrics {
  punctuality: number;
  locationAccuracy: number;
  tasksCompletionRate: number;
  overallScore: number;
}

export async function shiftLifecycleWorkflow(
  input: ShiftLifecycleInput
): Promise<ShiftLifecycleResult> {
  const { shiftId, caregiverId, patientId, scheduledStart, scheduledEnd, patientLocation } = input;
  
  let clockInData: ClockInData | null = null;
  let clockOutData: ClockOutData | null = null;
  let cancelled = false;
  let cancellationReason = '';

  // Signal handlers
  setHandler(clockInSignal, (data: ClockInData) => {
    clockInData = data;
  });

  setHandler(clockOutSignal, (data: ClockOutData) => {
    clockOutData = data;
  });

  setHandler(cancelShiftSignal, (reason: string) => {
    cancelled = true;
    cancellationReason = reason;
  });

  // Step 1: Pre-shift verification (1 hour before)
  const startTime = new Date(scheduledStart).getTime();
  const preShiftTime = startTime - 60 * 60 * 1000; // 1 hour before
  const now = Date.now();

  if (now < preShiftTime) {
    await sleep(preShiftTime - now);
  }

  if (cancelled) {
    return { shiftId, status: 'cancelled', evvVerified: false };
  }

  const requirements = await verifyShiftRequirements(shiftId, caregiverId);
  if (!requirements.canProceed) {
    await escalateToSupervisor(shiftId, 'requirements_not_met', requirements.issues);
    return { shiftId, status: 'cancelled', evvVerified: false };
  }

  // Send reminder 30 minutes before
  await sleep(30 * 60 * 1000);
  await sendShiftReminder(caregiverId, shiftId, scheduledStart);

  // Step 2: Wait for clock-in (allow 15 min late)
  const clockInDeadline = startTime + 15 * 60 * 1000;
  
  const clockedIn = await condition(
    () => clockInData !== null || cancelled,
    clockInDeadline - Date.now()
  );

  if (cancelled) {
    return { shiftId, status: 'cancelled', evvVerified: false };
  }

  if (!clockedIn || !clockInData) {
    await notifyNoShow(shiftId, caregiverId, patientId);
    await escalateToSupervisor(shiftId, 'no_show', []);
    return { shiftId, status: 'no_show', evvVerified: false };
  }

  // Type assertion after null check
  const confirmedClockIn = clockInData as ClockInData;

  // Verify clock-in location
  const clockInVerified = await recordClockIn(shiftId, {
    ...confirmedClockIn,
    expectedLocation: patientLocation,
  });

  // Step 3: Monitor shift progress
  const endTime = new Date(scheduledEnd).getTime();
  const clockOutDeadline = endTime + 30 * 60 * 1000; // Allow 30 min overtime

  const clockedOut = await condition(
    () => clockOutData !== null || cancelled,
    clockOutDeadline - Date.now()
  );

  // Type assertion for clockOut
  const confirmedClockOut: ClockOutData = clockOutData || {
    timestamp: new Date().toISOString(),
    latitude: 0,
    longitude: 0,
    tasksCompleted: [],
    notes: 'Auto clock-out due to no manual clock-out',
  };

  // Step 4: Process clock-out and EVV verification
  const clockOutVerified = await recordClockOut(shiftId, {
    ...confirmedClockOut,
    expectedLocation: patientLocation,
  });

  const evvResult = await verifyEVV(shiftId, {
    clockIn: confirmedClockIn,
    clockOut: confirmedClockOut,
    patientLocation,
  });

  // Step 5: Calculate metrics and finalize
  const actualStart = new Date(confirmedClockIn.timestamp);
  const actualEnd = new Date(confirmedClockOut.timestamp);
  const durationMinutes = Math.round((actualEnd.getTime() - actualStart.getTime()) / 60000);

  const metrics = await calculateShiftMetrics({
    shiftId,
    scheduledStart,
    scheduledEnd,
    actualStart: confirmedClockIn.timestamp,
    actualEnd: confirmedClockOut.timestamp,
    clockInLocation: { lat: confirmedClockIn.latitude, lng: confirmedClockIn.longitude },
    clockOutLocation: { lat: confirmedClockOut.latitude, lng: confirmedClockOut.longitude },
    patientLocation,
    evvVerified: evvResult.verified,
  });

  await processShiftCompletion(shiftId, {
    durationMinutes,
    evvVerified: evvResult.verified,
    metrics,
  });

  return {
    shiftId,
    status: evvResult.verified ? 'completed' : 'partial',
    actualStart: confirmedClockIn.timestamp,
    actualEnd: confirmedClockOut.timestamp,
    durationMinutes,
    evvVerified: evvResult.verified,
    metrics,
  };
}

