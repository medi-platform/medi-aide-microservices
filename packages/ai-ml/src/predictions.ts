/**
 * Shift Prediction and Optimization
 * Predicts staffing needs and optimizes schedules
 */

import { Injectable } from '@nestjs/common';

export interface HistoricalShift {
  date: Date;
  dayOfWeek: number;
  hour: number;
  patientCount: number;
  caregiverCount: number;
  shiftType: string;
  utilization: number; // 0-1
  cancellations: number;
  noShows: number;
}

export interface DemandPrediction {
  date: Date;
  hour: number;
  predictedDemand: number;
  confidence: number;
  factors: string[];
}

export interface StaffingRecommendation {
  date: Date;
  shifts: {
    startTime: string;
    endTime: string;
    recommendedCount: number;
    currentCount: number;
    gap: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  totalRecommended: number;
  totalCurrent: number;
  overallGap: number;
}

export interface CancellationRisk {
  shiftId: string;
  caregiverId: string;
  riskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendation: string;
}

@Injectable()
export class PredictionEngine {
  private seasonalFactors: Map<string, number> = new Map();
  private weekdayFactors: number[] = [0.7, 1.0, 1.0, 1.0, 1.0, 0.9, 0.7]; // Sun-Sat

  /**
   * Predict staffing demand for a date range
   */
  predictDemand(
    historicalData: HistoricalShift[],
    startDate: Date,
    endDate: Date,
  ): DemandPrediction[] {
    const predictions: DemandPrediction[] = [];
    
    // Calculate baseline from historical data
    const baseline = this.calculateBaseline(historicalData);
    const trends = this.calculateTrends(historicalData);
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      for (let hour = 6; hour <= 22; hour++) { // 6 AM to 10 PM
        const dayOfWeek = currentDate.getDay();
        const weekFactor = this.weekdayFactors[dayOfWeek];
        const hourFactor = this.getHourFactor(hour);
        const seasonFactor = this.getSeasonFactor(currentDate);
        const trendFactor = 1 + trends.weeklyGrowth * this.getWeeksSinceStart(historicalData, currentDate);

        const baseDemand = baseline.averagePatientCount;
        const predictedDemand = Math.round(
          baseDemand * weekFactor * hourFactor * seasonFactor * trendFactor,
        );

        const factors: string[] = [];
        if (weekFactor < 0.8) factors.push('Weekend reduction');
        if (hourFactor > 1.2) factors.push('Peak hours');
        if (seasonFactor > 1.1) factors.push('Seasonal increase');
        if (trendFactor > 1.05) factors.push('Growing demand trend');

        predictions.push({
          date: new Date(currentDate),
          hour,
          predictedDemand,
          confidence: this.calculateConfidence(historicalData.length),
          factors,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return predictions;
  }

  /**
   * Generate staffing recommendations
   */
  getStaffingRecommendations(
    predictions: DemandPrediction[],
    currentSchedule: { date: Date; startTime: string; endTime: string; count: number }[],
  ): StaffingRecommendation[] {
    const recommendations: StaffingRecommendation[] = [];
    const dateGroups = this.groupByDate(predictions);

    for (const [dateStr, dayPredictions] of dateGroups) {
      const date = new Date(dateStr);
      const shifts: StaffingRecommendation['shifts'] = [];

      // Define shift blocks
      const shiftBlocks = [
        { startTime: '06:00', endTime: '14:00', label: 'morning' },
        { startTime: '14:00', endTime: '22:00', label: 'afternoon' },
        { startTime: '22:00', endTime: '06:00', label: 'night' },
      ];

      for (const block of shiftBlocks) {
        const blockPredictions = dayPredictions.filter(
          (p) => p.hour >= parseInt(block.startTime) && p.hour < parseInt(block.endTime),
        );

        const peakDemand = Math.max(...blockPredictions.map((p) => p.predictedDemand), 0);
        const recommendedCount = Math.ceil(peakDemand / 4); // 1 caregiver per 4 patients

        const currentShifts = currentSchedule.filter(
          (s) =>
            s.date.toDateString() === date.toDateString() &&
            s.startTime === block.startTime,
        );
        const currentCount = currentShifts.reduce((sum, s) => sum + s.count, 0);

        const gap = recommendedCount - currentCount;
        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (gap >= 5) priority = 'critical';
        else if (gap >= 3) priority = 'high';
        else if (gap >= 1) priority = 'medium';

        shifts.push({
          startTime: block.startTime,
          endTime: block.endTime,
          recommendedCount,
          currentCount,
          gap,
          priority,
        });
      }

      const totalRecommended = shifts.reduce((sum, s) => sum + s.recommendedCount, 0);
      const totalCurrent = shifts.reduce((sum, s) => sum + s.currentCount, 0);

      recommendations.push({
        date,
        shifts,
        totalRecommended,
        totalCurrent,
        overallGap: totalRecommended - totalCurrent,
      });
    }

    return recommendations;
  }

  /**
   * Predict cancellation risk for shifts
   */
  predictCancellationRisk(
    caregiverHistory: {
      caregiverId: string;
      totalShifts: number;
      cancellations: number;
      lastCancellation?: Date;
      averageRating: number;
      recentWorkload: number; // hours in last 7 days
    }[],
    upcomingShifts: {
      shiftId: string;
      caregiverId: string;
      date: Date;
      hoursFromNow: number;
    }[],
  ): CancellationRisk[] {
    const risks: CancellationRisk[] = [];

    for (const shift of upcomingShifts) {
      const history = caregiverHistory.find((h) => h.caregiverId === shift.caregiverId);
      if (!history) continue;

      const factors: string[] = [];
      let riskScore = 0;

      // Base cancellation rate
      const cancellationRate = history.cancellations / Math.max(history.totalShifts, 1);
      riskScore += cancellationRate * 0.4;
      if (cancellationRate > 0.1) factors.push('High historical cancellation rate');

      // Recent cancellation
      if (history.lastCancellation) {
        const daysSinceCancellation =
          (Date.now() - history.lastCancellation.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCancellation < 7) {
          riskScore += 0.15;
          factors.push('Recent cancellation');
        }
      }

      // High workload
      if (history.recentWorkload > 40) {
        riskScore += 0.1;
        factors.push('High recent workload');
      }

      // Last minute shift
      if (shift.hoursFromNow < 24) {
        riskScore += 0.05;
        factors.push('Short notice');
      }

      // Weekend shifts
      const dayOfWeek = shift.date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        riskScore += 0.05;
        factors.push('Weekend shift');
      }

      // Low rating correlation
      if (history.averageRating < 3.5) {
        riskScore += 0.1;
        factors.push('Lower engagement indicators');
      }

      riskScore = Math.min(riskScore, 1);

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (riskScore >= 0.5) riskLevel = 'high';
      else if (riskScore >= 0.25) riskLevel = 'medium';

      let recommendation = 'No action needed';
      if (riskLevel === 'high') {
        recommendation = 'Consider backup caregiver assignment';
      } else if (riskLevel === 'medium') {
        recommendation = 'Send confirmation reminder';
      }

      risks.push({
        shiftId: shift.shiftId,
        caregiverId: shift.caregiverId,
        riskScore: Math.round(riskScore * 100) / 100,
        riskLevel,
        factors,
        recommendation,
      });
    }

    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Predict optimal shift times based on historical patterns
   */
  predictOptimalShiftTimes(
    historicalData: HistoricalShift[],
  ): { startTime: string; endTime: string; efficiency: number }[] {
    const hourlyEfficiency = new Map<number, number[]>();

    for (const shift of historicalData) {
      const efficiency = shift.utilization * (1 - shift.cancellations / Math.max(shift.caregiverCount, 1));
      if (!hourlyEfficiency.has(shift.hour)) {
        hourlyEfficiency.set(shift.hour, []);
      }
      hourlyEfficiency.get(shift.hour)!.push(efficiency);
    }

    const avgEfficiency = new Map<number, number>();
    for (const [hour, values] of hourlyEfficiency) {
      avgEfficiency.set(hour, values.reduce((a, b) => a + b, 0) / values.length);
    }

    // Find optimal shift blocks
    const optimalShifts: { startTime: string; endTime: string; efficiency: number }[] = [];

    // Morning peak
    const morningHours = [6, 7, 8, 9, 10, 11, 12, 13];
    const morningEfficiency = morningHours.reduce(
      (sum, h) => sum + (avgEfficiency.get(h) || 0),
      0,
    ) / morningHours.length;
    optimalShifts.push({
      startTime: '06:00',
      endTime: '14:00',
      efficiency: Math.round(morningEfficiency * 100) / 100,
    });

    // Afternoon/Evening
    const afternoonHours = [14, 15, 16, 17, 18, 19, 20, 21];
    const afternoonEfficiency = afternoonHours.reduce(
      (sum, h) => sum + (avgEfficiency.get(h) || 0),
      0,
    ) / afternoonHours.length;
    optimalShifts.push({
      startTime: '14:00',
      endTime: '22:00',
      efficiency: Math.round(afternoonEfficiency * 100) / 100,
    });

    return optimalShifts.sort((a, b) => b.efficiency - a.efficiency);
  }

  private calculateBaseline(data: HistoricalShift[]): {
    averagePatientCount: number;
    averageCaregiverCount: number;
  } {
    if (data.length === 0) {
      return { averagePatientCount: 10, averageCaregiverCount: 5 };
    }

    return {
      averagePatientCount:
        data.reduce((sum, d) => sum + d.patientCount, 0) / data.length,
      averageCaregiverCount:
        data.reduce((sum, d) => sum + d.caregiverCount, 0) / data.length,
    };
  }

  private calculateTrends(data: HistoricalShift[]): { weeklyGrowth: number } {
    if (data.length < 14) return { weeklyGrowth: 0 };

    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstWeek = sortedData.slice(0, 7);
    const lastWeek = sortedData.slice(-7);

    const firstAvg = firstWeek.reduce((s, d) => s + d.patientCount, 0) / 7;
    const lastAvg = lastWeek.reduce((s, d) => s + d.patientCount, 0) / 7;

    const weeks = (sortedData[sortedData.length - 1].date.getTime() - sortedData[0].date.getTime()) / (7 * 24 * 60 * 60 * 1000);
    const weeklyGrowth = weeks > 0 ? (lastAvg - firstAvg) / firstAvg / weeks : 0;

    return { weeklyGrowth: Math.max(-0.1, Math.min(0.1, weeklyGrowth)) };
  }

  private getHourFactor(hour: number): number {
    // Peak hours: 8-10 AM, 4-6 PM
    if ((hour >= 8 && hour <= 10) || (hour >= 16 && hour <= 18)) return 1.3;
    if (hour >= 11 && hour <= 15) return 1.0;
    if (hour < 6 || hour > 22) return 0.5;
    return 0.8;
  }

  private getSeasonFactor(date: Date): number {
    const month = date.getMonth();
    // Winter months typically have higher demand (flu season, etc.)
    if (month >= 11 || month <= 2) return 1.15;
    // Summer slightly lower
    if (month >= 6 && month <= 8) return 0.9;
    return 1.0;
  }

  private getWeeksSinceStart(data: HistoricalShift[], date: Date): number {
    if (data.length === 0) return 0;
    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    return (date.getTime() - sortedData[0].date.getTime()) / (7 * 24 * 60 * 60 * 1000);
  }

  private calculateConfidence(dataPoints: number): number {
    if (dataPoints >= 90) return 0.95;
    if (dataPoints >= 30) return 0.8;
    if (dataPoints >= 14) return 0.6;
    return 0.4;
  }

  private groupByDate(predictions: DemandPrediction[]): Map<string, DemandPrediction[]> {
    const groups = new Map<string, DemandPrediction[]>();
    for (const pred of predictions) {
      const dateStr = pred.date.toISOString().split('T')[0];
      if (!groups.has(dateStr)) {
        groups.set(dateStr, []);
      }
      groups.get(dateStr)!.push(pred);
    }
    return groups;
  }
}
