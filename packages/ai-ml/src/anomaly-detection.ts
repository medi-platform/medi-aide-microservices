/**
 * Anomaly Detection for Healthcare Monitoring
 * Detects unusual patterns in vitals, incidents, and behavior
 */

import { Injectable } from '@nestjs/common';

export interface VitalReading {
  patientId: string;
  type: 'blood_pressure_systolic' | 'blood_pressure_diastolic' | 'heart_rate' | 'temperature' | 'oxygen_saturation' | 'blood_glucose';
  value: number;
  timestamp: Date;
}

export interface VitalAnomaly {
  patientId: string;
  type: string;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  deviation: number; // standard deviations from mean
  timestamp: Date;
  recommendation: string;
}

export interface IncidentPattern {
  patientId: string;
  pattern: string;
  frequency: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  riskLevel: 'low' | 'medium' | 'high';
  details: string;
}

export interface BehaviorAnomaly {
  caregiverId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

// Normal ranges for vitals (can be customized per patient)
const VITAL_RANGES: Record<string, { min: number; max: number; criticalMin: number; criticalMax: number }> = {
  blood_pressure_systolic: { min: 90, max: 140, criticalMin: 70, criticalMax: 180 },
  blood_pressure_diastolic: { min: 60, max: 90, criticalMin: 40, criticalMax: 120 },
  heart_rate: { min: 60, max: 100, criticalMin: 40, criticalMax: 150 },
  temperature: { min: 36.1, max: 37.2, criticalMin: 35, criticalMax: 39 },
  oxygen_saturation: { min: 95, max: 100, criticalMin: 88, criticalMax: 100 },
  blood_glucose: { min: 70, max: 140, criticalMin: 50, criticalMax: 300 },
};

@Injectable()
export class AnomalyDetector {
  /**
   * Detect anomalies in vital signs
   */
  detectVitalAnomalies(
    readings: VitalReading[],
    patientBaselines?: Map<string, { mean: number; stdDev: number }>,
  ): VitalAnomaly[] {
    const anomalies: VitalAnomaly[] = [];

    for (const reading of readings) {
      const range = VITAL_RANGES[reading.type];
      if (!range) continue;

      // Check against normal ranges
      let severity: VitalAnomaly['severity'] = 'low';
      let deviation = 0;
      let recommendation = '';

      // Critical check
      if (reading.value <= range.criticalMin || reading.value >= range.criticalMax) {
        severity = 'critical';
        recommendation = 'Immediate medical attention required';
      }
      // High severity
      else if (reading.value < range.min * 0.9 || reading.value > range.max * 1.1) {
        severity = 'high';
        recommendation = 'Contact healthcare provider soon';
      }
      // Medium severity
      else if (reading.value < range.min || reading.value > range.max) {
        severity = 'medium';
        recommendation = 'Monitor closely and document';
      }
      // Check against patient baseline if available
      else if (patientBaselines?.has(`${reading.patientId}-${reading.type}`)) {
        const baseline = patientBaselines.get(`${reading.patientId}-${reading.type}`)!;
        deviation = Math.abs(reading.value - baseline.mean) / baseline.stdDev;

        if (deviation > 3) {
          severity = 'high';
          recommendation = 'Significant deviation from patient baseline';
        } else if (deviation > 2) {
          severity = 'medium';
          recommendation = 'Notable deviation from patient baseline';
        } else {
          continue; // No anomaly
        }
      } else {
        continue; // No anomaly
      }

      anomalies.push({
        patientId: reading.patientId,
        type: reading.type,
        value: reading.value,
        expectedRange: { min: range.min, max: range.max },
        severity,
        deviation,
        timestamp: reading.timestamp,
        recommendation,
      });
    }

    return anomalies.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Detect patterns in incidents
   */
  detectIncidentPatterns(
    incidents: {
      patientId: string;
      type: string;
      timestamp: Date;
      severity: string;
    }[],
  ): IncidentPattern[] {
    const patterns: IncidentPattern[] = [];
    const patientIncidents = new Map<string, typeof incidents>();

    // Group by patient
    for (const incident of incidents) {
      if (!patientIncidents.has(incident.patientId)) {
        patientIncidents.set(incident.patientId, []);
      }
      patientIncidents.get(incident.patientId)!.push(incident);
    }

    for (const [patientId, patientData] of patientIncidents) {
      // Check for fall patterns
      const falls = patientData.filter((i) => i.type.toLowerCase().includes('fall'));
      if (falls.length >= 2) {
        const trend = this.calculateTrend(falls.map((f) => f.timestamp));
        patterns.push({
          patientId,
          pattern: 'Recurring falls',
          frequency: falls.length,
          trend,
          riskLevel: falls.length >= 3 ? 'high' : 'medium',
          details: `${falls.length} falls detected. ${trend === 'increasing' ? 'Frequency is increasing.' : ''}`,
        });
      }

      // Check for medication errors
      const medErrors = patientData.filter((i) => i.type.toLowerCase().includes('medication'));
      if (medErrors.length >= 2) {
        patterns.push({
          patientId,
          pattern: 'Medication-related incidents',
          frequency: medErrors.length,
          trend: this.calculateTrend(medErrors.map((m) => m.timestamp)),
          riskLevel: medErrors.length >= 3 ? 'high' : 'medium',
          details: `${medErrors.length} medication-related incidents detected`,
        });
      }

      // Check for behavioral incidents
      const behavioral = patientData.filter((i) =>
        ['agitation', 'aggression', 'wandering'].some((t) =>
          i.type.toLowerCase().includes(t),
        ),
      );
      if (behavioral.length >= 3) {
        patterns.push({
          patientId,
          pattern: 'Behavioral concerns',
          frequency: behavioral.length,
          trend: this.calculateTrend(behavioral.map((b) => b.timestamp)),
          riskLevel: 'medium',
          details: 'Multiple behavioral incidents may indicate need for care plan review',
        });
      }

      // General incident frequency check
      const last30Days = patientData.filter(
        (i) => Date.now() - i.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000,
      );
      if (last30Days.length >= 5) {
        patterns.push({
          patientId,
          pattern: 'High incident frequency',
          frequency: last30Days.length,
          trend: 'increasing',
          riskLevel: 'high',
          details: `${last30Days.length} incidents in the last 30 days`,
        });
      }
    }

    return patterns.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
  }

  /**
   * Detect unusual caregiver behavior patterns
   */
  detectBehaviorAnomalies(
    caregiverData: {
      caregiverId: string;
      shiftsCompleted: number;
      averageShiftLength: number;
      clockInVariance: number; // minutes
      documentationRate: number; // 0-1
      patientRatings: number[];
      incidentReports: number;
      missedTasks: number;
    }[],
  ): BehaviorAnomaly[] {
    const anomalies: BehaviorAnomaly[] = [];

    // Calculate benchmarks
    const avgDocRate = caregiverData.reduce((s, c) => s + c.documentationRate, 0) / caregiverData.length;
    const avgRating = caregiverData.reduce(
      (s, c) => s + (c.patientRatings.length > 0 ? c.patientRatings.reduce((a, b) => a + b, 0) / c.patientRatings.length : 0),
      0,
    ) / caregiverData.length;

    for (const caregiver of caregiverData) {
      // Low documentation rate
      if (caregiver.documentationRate < avgDocRate * 0.7) {
        anomalies.push({
          caregiverId: caregiver.caregiverId,
          type: 'Low Documentation',
          description: `Documentation rate ${Math.round(caregiver.documentationRate * 100)}% is below average`,
          severity: caregiver.documentationRate < 0.5 ? 'high' : 'medium',
          recommendation: 'Provide documentation training and reminders',
        });
      }

      // Inconsistent clock-in times
      if (caregiver.clockInVariance > 15) {
        anomalies.push({
          caregiverId: caregiver.caregiverId,
          type: 'Clock-in Variance',
          description: `Average clock-in variance of ${Math.round(caregiver.clockInVariance)} minutes`,
          severity: caregiver.clockInVariance > 30 ? 'high' : 'medium',
          recommendation: 'Review punctuality expectations',
        });
      }

      // Declining ratings
      if (caregiver.patientRatings.length >= 5) {
        const recentRatings = caregiver.patientRatings.slice(-5);
        const recentAvg = recentRatings.reduce((a, b) => a + b, 0) / 5;
        if (recentAvg < 3.0) {
          anomalies.push({
            caregiverId: caregiver.caregiverId,
            type: 'Low Patient Ratings',
            description: `Recent average rating of ${recentAvg.toFixed(1)} is below acceptable threshold`,
            severity: recentAvg < 2.5 ? 'high' : 'medium',
            recommendation: 'Schedule performance review and additional training',
          });
        }
      }

      // High incident reports
      const incidentRate = caregiver.incidentReports / Math.max(caregiver.shiftsCompleted, 1);
      if (incidentRate > 0.1) {
        anomalies.push({
          caregiverId: caregiver.caregiverId,
          type: 'High Incident Rate',
          description: `Incident rate of ${Math.round(incidentRate * 100)}% exceeds threshold`,
          severity: incidentRate > 0.2 ? 'high' : 'medium',
          recommendation: 'Review incident patterns and provide targeted support',
        });
      }

      // Missed tasks
      const missedTaskRate = caregiver.missedTasks / Math.max(caregiver.shiftsCompleted * 10, 1);
      if (missedTaskRate > 0.1) {
        anomalies.push({
          caregiverId: caregiver.caregiverId,
          type: 'Missed Tasks',
          description: `${caregiver.missedTasks} tasks missed across ${caregiver.shiftsCompleted} shifts`,
          severity: missedTaskRate > 0.2 ? 'high' : 'medium',
          recommendation: 'Review task completion workflow and provide support',
        });
      }
    }

    return anomalies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Calculate patient baselines from historical data
   */
  calculateBaselines(
    readings: VitalReading[],
    minDataPoints: number = 10,
  ): Map<string, { mean: number; stdDev: number }> {
    const baselines = new Map<string, { mean: number; stdDev: number }>();
    const grouped = new Map<string, number[]>();

    for (const reading of readings) {
      const key = `${reading.patientId}-${reading.type}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(reading.value);
    }

    for (const [key, values] of grouped) {
      if (values.length < minDataPoints) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      baselines.set(key, { mean, stdDev });
    }

    return baselines;
  }

  private calculateTrend(dates: Date[]): 'increasing' | 'stable' | 'decreasing' {
    if (dates.length < 2) return 'stable';

    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];

    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(sortedDates[i].getTime() - sortedDates[i - 1].getTime());
    }

    if (intervals.length < 2) return 'stable';

    const firstHalf = intervals.slice(0, Math.floor(intervals.length / 2));
    const secondHalf = intervals.slice(Math.floor(intervals.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const ratio = secondAvg / firstAvg;
    if (ratio < 0.7) return 'increasing';
    if (ratio > 1.3) return 'decreasing';
    return 'stable';
  }
}
