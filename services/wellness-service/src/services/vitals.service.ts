import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { PhysioSample } from '../entities/physio-sample.entity';
import { VitalsThresholds } from '../entities/vitals-thresholds.entity';
import { CreateVitalsDto, VitalsResponseDto, VitalsHistoryQueryDto } from '../dto/vitals.dto';
import { WellnessMetricType } from '../enums/recommendation-type.enum';

@Injectable()
export class VitalsService {
  private readonly logger = new Logger(VitalsService.name);

  // Default thresholds for vitals
  private readonly defaultThresholds = {
    HR: { warningLow: 50, warningHigh: 100, criticalLow: 40, criticalHigh: 120 },
    SpO2: { warningLow: 95, criticalLow: 90 },
    HRV_RMSSD: { warningLow: 20, warningHigh: 100 },
  };

  constructor(
    @InjectRepository(PhysioSample)
    private readonly physioRepo: Repository<PhysioSample>,
    @InjectRepository(VitalsThresholds)
    private readonly thresholdsRepo: Repository<VitalsThresholds>,
  ) {}

  /**
   * Get personal baselines for a user
   */
  async getPersonalBaselines(userId: string): Promise<{ hr: number; hrv: number }> {
    const hrSamples = await this.physioRepo.find({
      where: { userId, metric: WellnessMetricType.HEART_RATE },
      order: { recordedAt: 'DESC' },
      take: 100,
    });

    const hrvSamples = await this.physioRepo.find({
      where: { userId, metric: WellnessMetricType.HRV_RMSSD },
      order: { recordedAt: 'DESC' },
      take: 100,
    });

    const avgHr = hrSamples.length > 0
      ? hrSamples.reduce((sum, s) => sum + s.value, 0) / hrSamples.length
      : 70;

    const avgHrv = hrvSamples.length > 0
      ? hrvSamples.reduce((sum, s) => sum + s.value, 0) / hrvSamples.length
      : 50;

    return { hr: Math.round(avgHr), hrv: Math.round(avgHrv) };
  }

  /**
   * Get user vitals summary
   */
  async getUserVitals(userId: string): Promise<VitalsResponseDto> {
    const latestHr = await this.getLatestSample(userId, WellnessMetricType.HEART_RATE);
    const latestHrv = await this.getLatestSample(userId, WellnessMetricType.HRV_RMSSD);
    const latestSpO2 = await this.getLatestSample(userId, WellnessMetricType.SPO2);

    const nowIso = new Date().toISOString();
    const hrVal = latestHr?.value ?? null;
    const hrTs = latestHr?.recordedAt?.toISOString() ?? nowIso;

    const hrvVal = latestHrv?.value ?? null;
    const hrvTs = latestHrv?.recordedAt?.toISOString() ?? nowIso;

    const spo2Val = latestSpO2?.value ?? null;
    const spo2Ts = latestSpO2?.recordedAt?.toISOString() ?? nowIso;

    return {
      userId,
      timestamp: nowIso,
      vitals: {
        heartRate: hrVal !== null ? {
          value: hrVal,
          unit: 'bpm',
          timestamp: hrTs,
          status: this.getHeartRateStatus(hrVal),
        } : undefined,
        oxygenSaturation: spo2Val !== null ? {
          value: spo2Val,
          unit: '%',
          timestamp: spo2Ts,
          status: this.getSpO2Status(spo2Val),
        } : undefined,
        hrvRmssd: hrvVal !== null ? {
          value: hrvVal,
          unit: 'ms',
          timestamp: hrvTs,
          status: 'informational',
        } : undefined,
      },
      summary: {
        overallStatus: this.getOverallStatus(hrVal, spo2Val),
        alertCount: this.countAlerts(hrVal, spo2Val),
        lastUpdated: nowIso,
      },
    };
  }

  /**
   * Create new vitals record
   */
  async createVitals(userId: string, dto: CreateVitalsDto): Promise<VitalsResponseDto> {
    const now = new Date();
    const samples: Partial<PhysioSample>[] = [];

    if (dto.heartRate !== undefined) {
      samples.push({
        userId,
        metric: WellnessMetricType.HEART_RATE,
        value: dto.heartRate,
        unit: 'bpm',
        deviceId: dto.deviceId,
        recordedAt: now,
      });
    }

    if (dto.hrvRmssd !== undefined) {
      samples.push({
        userId,
        metric: WellnessMetricType.HRV_RMSSD,
        value: dto.hrvRmssd,
        unit: 'ms',
        deviceId: dto.deviceId,
        recordedAt: now,
      });
    }

    if (dto.oxygenSaturation !== undefined) {
      samples.push({
        userId,
        metric: WellnessMetricType.SPO2,
        value: dto.oxygenSaturation,
        unit: '%',
        deviceId: dto.deviceId,
        recordedAt: now,
      });
    }

    if (samples.length > 0) {
      await this.physioRepo.save(samples.map(s => this.physioRepo.create(s)));
      this.logger.log(`✅ Saved ${samples.length} vitals samples for user ${userId}`);
    }

    return this.getUserVitals(userId);
  }

  /**
   * Get vitals history
   */
  async getVitalsHistory(userId: string, query: VitalsHistoryQueryDto): Promise<{
    userId: string;
    history: Array<{
      timestamp: string;
      metric: string;
      value: number;
      device?: string;
    }>;
    pagination: { total: number; limit: number; offset: number };
  }> {
    const limit = query.limit ?? 100;
    const whereClause: Record<string, unknown> = { userId };

    if (query.metric) {
      whereClause.metric = query.metric;
    }

    const queryBuilder = this.physioRepo.createQueryBuilder('sample')
      .where('sample.userId = :userId', { userId })
      .orderBy('sample.recordedAt', 'DESC')
      .take(limit);

    if (query.startDate) {
      queryBuilder.andWhere('sample.recordedAt >= :startDate', { startDate: new Date(query.startDate) });
    }
    if (query.endDate) {
      queryBuilder.andWhere('sample.recordedAt <= :endDate', { endDate: new Date(query.endDate) });
    }
    if (query.metric) {
      queryBuilder.andWhere('sample.metric = :metric', { metric: query.metric });
    }

    const samples = await queryBuilder.getMany();

    return {
      userId,
      history: samples.map(s => ({
        timestamp: s.recordedAt?.toISOString() ?? new Date().toISOString(),
        metric: s.metric,
        value: s.value,
        device: s.deviceType,
      })),
      pagination: {
        total: samples.length,
        limit,
        offset: 0,
      },
    };
  }

  /**
   * Get vitals trends
   */
  async getVitalsTrends(userId: string, metric: string, period: string): Promise<{
    userId: string;
    metric: string;
    period: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    data: Array<{ timestamp: string; value: number }>;
    insights: string[];
    statistics: { min: number; max: number; avg: number; stdDev: number };
  }> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const samples = await this.physioRepo.find({
      where: {
        userId,
        metric,
        recordedAt: MoreThanOrEqual(startDate),
      },
      order: { recordedAt: 'ASC' },
    });

    if (samples.length === 0) {
      return {
        userId,
        metric,
        period,
        trend: 'stable',
        data: [],
        insights: ['No data available for this period'],
        statistics: { min: 0, max: 0, avg: 0, stdDev: 0 },
      };
    }

    const values = samples.map(s => s.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (samples.length >= 5) {
      const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const earlierAvg = values.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const diff = recentAvg - earlierAvg;
      if (diff > stdDev) trend = 'increasing';
      else if (diff < -stdDev) trend = 'decreasing';
    }

    const insights = this.generateVitalsInsights(metric, avg, trend, stdDev);

    return {
      userId,
      metric,
      period,
      trend,
      data: samples.map(s => ({
        timestamp: s.recordedAt.toISOString(),
        value: s.value,
      })),
      insights,
      statistics: { min, max, avg: Math.round(avg * 100) / 100, stdDev: Math.round(stdDev * 100) / 100 },
    };
  }

  /**
   * Get user thresholds
   */
  async getUserThresholds(userId: string, metricType?: string): Promise<VitalsThresholds[]> {
    const where: Record<string, unknown> = { userId };
    if (metricType) {
      where.metricType = metricType;
    }
    return this.thresholdsRepo.find({ where });
  }

  /**
   * Update user thresholds
   */
  async updateThresholds(
    userId: string,
    metricType: string,
    thresholds: Partial<VitalsThresholds>,
  ): Promise<VitalsThresholds> {
    let existing = await this.thresholdsRepo.findOne({
      where: { userId, metricType },
    });

    if (!existing) {
      existing = this.thresholdsRepo.create({
        userId,
        metricType,
        ...thresholds,
        isPersonalized: true,
      });
    } else {
      Object.assign(existing, thresholds, { isPersonalized: true });
    }

    return this.thresholdsRepo.save(existing);
  }

  // Private helper methods

  private async getLatestSample(userId: string, metric: string): Promise<PhysioSample | null> {
    return this.physioRepo.findOne({
      where: { userId, metric },
      order: { recordedAt: 'DESC' },
    });
  }

  private getHeartRateStatus(hr: number): 'normal' | 'warning' | 'critical' {
    const t = this.defaultThresholds.HR;
    if (hr < t.criticalLow || hr > t.criticalHigh) return 'critical';
    if (hr < t.warningLow || hr > t.warningHigh) return 'warning';
    return 'normal';
  }

  private getSpO2Status(spo2: number): 'normal' | 'warning' | 'critical' {
    const t = this.defaultThresholds.SpO2;
    if (spo2 < t.criticalLow) return 'critical';
    if (spo2 < t.warningLow) return 'warning';
    return 'normal';
  }

  private getOverallStatus(hr: number | null, spo2: number | null): 'healthy' | 'degraded' | 'critical' {
    if (hr !== null && this.getHeartRateStatus(hr) === 'critical') return 'critical';
    if (spo2 !== null && this.getSpO2Status(spo2) === 'critical') return 'critical';
    if ((hr !== null && this.getHeartRateStatus(hr) === 'warning') ||
        (spo2 !== null && this.getSpO2Status(spo2) === 'warning')) {
      return 'degraded';
    }
    return 'healthy';
  }

  private countAlerts(hr: number | null, spo2: number | null): number {
    let count = 0;
    if (hr !== null && this.getHeartRateStatus(hr) !== 'normal') count++;
    if (spo2 !== null && this.getSpO2Status(spo2) !== 'normal') count++;
    return count;
  }

  private generateVitalsInsights(
    metric: string,
    avg: number,
    trend: string,
    stdDev: number,
  ): string[] {
    const insights: string[] = [];

    if (metric === WellnessMetricType.HEART_RATE) {
      if (avg < 60) {
        insights.push('Your average heart rate is in the bradycardia range');
      } else if (avg > 100) {
        insights.push('Your average heart rate is elevated');
      } else {
        insights.push('Your heart rate is within normal range');
      }

      if (stdDev > 15) {
        insights.push('Your heart rate shows high variability');
      }
    }

    if (metric === WellnessMetricType.HRV_RMSSD) {
      if (avg < 20) {
        insights.push('Low HRV may indicate high stress or fatigue');
      } else if (avg > 60) {
        insights.push('Good HRV indicates healthy autonomic function');
      }
    }

    if (trend === 'increasing') {
      insights.push(`Your ${metric} has been trending upward`);
    } else if (trend === 'decreasing') {
      insights.push(`Your ${metric} has been trending downward`);
    }

    return insights;
  }
}

