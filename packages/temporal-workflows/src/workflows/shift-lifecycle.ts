/**
 * Shift Lifecycle Workflow
 * 
 * Handles the complete lifecycle of a care shift with EVV compliance.
 */

import { proxyActivities, defineSignal, defineQuery, setHandler, condition } from '@temporalio/workflow';

export const clockInSignal = defineSignal<[ClockData]>('clockIn');
export const clockOutSignal = defineSignal<[ClockData]>('clockOut');
export const getShiftStatusQuery = defineQuery<ShiftStatus>('getShiftStatus');

export interface ClockData {
  timestamp: string;
  latitude: number;
  longitude: number;
  method: 'gps' | 'manual' | 'telephony';
  tasksCompleted?: string[];
}

export interface ShiftInput {
  shiftId: string;
  caregiverId: string;
  patientId: string;
  scheduledStart: string;
  scheduledEnd: string;
  location: { lat: number; lng: number };
}

export interface ShiftStatus {
  phase: 'scheduled' | 'in-progress' | 'completed' | 'missed' | 'cancelled';
  clockedIn: boolean;
  clockedOut: boolean;
  clockInData?: ClockData;
  clockOutData?: ClockData;
  verificationStatus: 'pending' | 'verified' | 'flagged';
  durationMinutes?: number;
}

const activities = proxyActivities<{
  verifyClockIn: (shiftId: string, data: any) => Promise<{ valid: boolean; verificationId: string }>;
  verifyClockOut: (shiftId: string, data: any) => Promise<{ valid: boolean; verificationId: string }>;
  sendAlert: (alertType: string, recipients: string[], message: string) => Promise<{ sent: boolean }>;
}>({
  startToCloseTimeout: '1 minute',
  retry: { maximumAttempts: 3 },
});

export async function shiftLifecycleWorkflow(input: ShiftInput): Promise<ShiftStatus> {
  const status: ShiftStatus = {
    phase: 'scheduled',
    clockedIn: false,
    clockedOut: false,
    verificationStatus: 'pending',
  };

  let clockInData: ClockData | null = null;
  let clockOutData: ClockData | null = null;

  // Handle signals
  setHandler(clockInSignal, (data: ClockData) => {
    clockInData = data;
    status.clockInData = data;
    status.clockedIn = true;
    status.phase = 'in-progress';
  });

  setHandler(clockOutSignal, (data: ClockData) => {
    clockOutData = data;
    status.clockOutData = data;
    status.clockedOut = true;
  });

  setHandler(getShiftStatusQuery, () => status);

  // Wait for clock-in (with 30-minute grace period after scheduled start)
  const clockedIn = await condition(() => clockInData !== null, '8 hours');
  
  if (!clockedIn || !clockInData) {
    status.phase = 'missed';
    await activities.sendAlert('shift-missed', [input.caregiverId], 
      `Shift ${input.shiftId} was missed`);
    return status;
  }

  // Verify clock-in
  const confirmedClockIn = clockInData as ClockData;
  const clockInVerification = await activities.verifyClockIn(input.shiftId, {
    timestamp: confirmedClockIn.timestamp,
    latitude: confirmedClockIn.latitude,
    longitude: confirmedClockIn.longitude,
    method: confirmedClockIn.method,
  });

  if (!clockInVerification.valid) {
    status.verificationStatus = 'flagged';
  }

  // Wait for clock-out
  await condition(() => clockOutData !== null, '24 hours');

  if (!clockOutData) {
    status.phase = 'missed';
    status.verificationStatus = 'flagged';
    return status;
  }

  // Verify clock-out
  const confirmedClockOut = clockOutData as ClockData;
  const clockOutVerification = await activities.verifyClockOut(input.shiftId, {
    timestamp: confirmedClockOut.timestamp,
    latitude: confirmedClockOut.latitude,
    longitude: confirmedClockOut.longitude,
    method: confirmedClockOut.method,
    tasksCompleted: confirmedClockOut.tasksCompleted || [],
  });

  // Calculate duration
  const clockInTime = new Date(confirmedClockIn.timestamp).getTime();
  const clockOutTime = new Date(confirmedClockOut.timestamp).getTime();
  status.durationMinutes = Math.round((clockOutTime - clockInTime) / 60000);

  status.phase = 'completed';
  status.verificationStatus = clockOutVerification.valid ? 'verified' : 'flagged';

  return status;
}

