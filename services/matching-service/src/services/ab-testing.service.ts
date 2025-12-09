import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Experiment, ExperimentVariant } from '../interfaces/matching.interfaces';

/**
 * A/B Testing Service
 * 
 * Uber-grade experimentation framework for matching algorithms.
 * Supports traffic allocation, sticky assignments, and statistical analysis.
 */
@Injectable()
export class ABTestingService implements OnModuleInit {
  private readonly logger = new Logger(ABTestingService.name);
  private redis: Redis | null = null;
  
  // In-memory experiment cache
  private experiments: Map<string, Experiment> = new Map();
  
  private readonly ENABLED = process.env.AB_TESTING_ENABLED === 'true';
  private readonly EXPERIMENT_PREFIX = 'experiment';
  private readonly ASSIGNMENT_PREFIX = 'assignment';
  private readonly METRICS_PREFIX = 'metrics';
  
  async onModuleInit(): Promise<void> {
    if (!this.ENABLED) {
      this.logger.log('A/B Testing disabled');
      return;
    }
    
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.redis = new Redis(redisUrl, { lazyConnect: true });
      await this.redis.connect();
      await this.loadExperiments();
      this.logger.log('A/B Testing Service initialized');
    } catch (error) {
      this.logger.warn(`Redis connection failed: ${error}`);
      this.redis = null;
    }
  }
  
  /**
   * Create a new experiment
   */
  async createExperiment(config: Omit<Experiment, 'id' | 'status'>): Promise<Experiment> {
    const experiment: Experiment = {
      id: uuidv4(),
      ...config,
      status: 'draft',
    };
    
    this.experiments.set(experiment.id, experiment);
    
    if (this.redis) {
      await this.redis.set(
        `${this.EXPERIMENT_PREFIX}:${experiment.id}`,
        JSON.stringify(experiment)
      );
    }
    
    this.logger.log(`Created experiment: ${experiment.name} (${experiment.id})`);
    return experiment;
  }
  
  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    experiment.status = 'running';
    experiment.startDate = new Date();
    
    if (this.redis) {
      await this.redis.set(
        `${this.EXPERIMENT_PREFIX}:${experimentId}`,
        JSON.stringify(experiment)
      );
    }
    
    this.logger.log(`Started experiment: ${experiment.name}`);
  }
  
  /**
   * Stop an experiment
   */
  async stopExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    experiment.status = 'completed';
    experiment.endDate = new Date();
    
    if (this.redis) {
      await this.redis.set(
        `${this.EXPERIMENT_PREFIX}:${experimentId}`,
        JSON.stringify(experiment)
      );
    }
    
    this.logger.log(`Stopped experiment: ${experiment.name}`);
  }
  
  /**
   * Get variant for a user (with sticky assignment)
   */
  async getVariantForUser(
    userId: string,
    experimentId: string
  ): Promise<ExperimentVariant | null> {
    if (!this.ENABLED) return null;
    
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment || experiment.status !== 'running') {
      return null;
    }
    
    // Check targeting criteria
    if (!this.meetsTargetingCriteria(userId, experiment)) {
      return null;
    }
    
    // Check for existing assignment (sticky)
    const assignmentKey = `${this.ASSIGNMENT_PREFIX}:${experimentId}:${userId}`;
    
    if (this.redis) {
      const existingAssignment = await this.redis.get(assignmentKey);
      
      if (existingAssignment) {
        return experiment.variants.find(v => v.id === existingAssignment) || null;
      }
    }
    
    // Assign user to variant
    const variant = this.assignVariant(userId, experiment);
    
    if (this.redis && variant) {
      await this.redis.set(assignmentKey, variant.id);
    }
    
    return variant;
  }
  
  /**
   * Record a metric for an experiment
   */
  async recordMetric(
    experimentId: string,
    variantId: string,
    metricName: string,
    value: number
  ): Promise<void> {
    if (!this.ENABLED || !this.redis) return;
    
    const key = `${this.METRICS_PREFIX}:${experimentId}:${variantId}:${metricName}`;
    
    try {
      // Store as sorted set with timestamp
      await this.redis.zadd(key, Date.now(), JSON.stringify({
        value,
        timestamp: new Date().toISOString(),
      }));
      
      // Keep only last 7 days of data
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.redis.zremrangebyscore(key, '-inf', cutoff);
      
    } catch (error) {
      this.logger.warn(`Failed to record metric: ${error}`);
    }
  }
  
  /**
   * Analyze experiment results
   */
  async analyzeExperiment(experimentId: string): Promise<ExperimentAnalysis> {
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    const variantResults: VariantResult[] = [];
    
    for (const variant of experiment.variants) {
      const metrics = await this.getVariantMetrics(experimentId, variant.id);
      variantResults.push({
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        metrics,
      });
    }
    
    // Statistical analysis
    const control = variantResults.find(v => v.isControl);
    const treatments = variantResults.filter(v => !v.isControl);
    
    let winningVariant: string | null = null;
    let isSignificant = false;
    let confidence = 0;
    
    if (control && treatments.length > 0) {
      const primaryMetric = experiment.primaryMetric;
      const controlValue = control.metrics[primaryMetric]?.mean || 0;
      
      for (const treatment of treatments) {
        const treatmentValue = treatment.metrics[primaryMetric]?.mean || 0;
        
        // Simple significance test (z-test)
        const { significant, pValue } = this.zTest(
          controlValue,
          control.metrics[primaryMetric]?.stdDev || 0,
          control.metrics[primaryMetric]?.count || 0,
          treatmentValue,
          treatment.metrics[primaryMetric]?.stdDev || 0,
          treatment.metrics[primaryMetric]?.count || 0
        );
        
        if (significant && treatmentValue > controlValue) {
          winningVariant = treatment.variantId;
          isSignificant = true;
          confidence = 1 - pValue;
        }
      }
    }
    
    return {
      experimentId,
      experimentName: experiment.name,
      status: experiment.status,
      variantResults,
      winningVariant,
      isSignificant,
      confidence,
      recommendation: this.getRecommendation(winningVariant, isSignificant, confidence),
    };
  }
  
  /**
   * Get all experiments
   */
  getExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }
  
  /**
   * Get running experiments
   */
  getRunningExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
      .filter(e => e.status === 'running');
  }
  
  // Private methods
  
  private async loadExperiments(): Promise<void> {
    if (!this.redis) return;
    
    try {
      const keys = await this.redis.keys(`${this.EXPERIMENT_PREFIX}:*`);
      
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const experiment = JSON.parse(data) as Experiment;
          this.experiments.set(experiment.id, experiment);
        }
      }
      
      this.logger.log(`Loaded ${this.experiments.size} experiments`);
      
    } catch (error) {
      this.logger.error(`Failed to load experiments: ${error}`);
    }
  }
  
  private meetsTargetingCriteria(userId: string, experiment: Experiment): boolean {
    const { targeting } = experiment;
    
    // Sample rate check
    if (targeting.sampleRate < 1) {
      const hash = this.hashString(userId);
      if (hash > targeting.sampleRate) {
        return false;
      }
    }
    
    // Additional targeting criteria would go here
    return true;
  }
  
  private assignVariant(userId: string, experiment: Experiment): ExperimentVariant | null {
    const { allocation, variants } = experiment;
    
    if (allocation.type === 'sticky' || allocation.type === 'percentage') {
      // Consistent hashing based on userId
      const hash = this.hashString(`${userId}:${experiment.id}`);
      
      let cumulative = 0;
      for (const variant of variants) {
        cumulative += (allocation.percentages[variant.id] || 0) / 100;
        if (hash <= cumulative) {
          return variant;
        }
      }
    }
    
    if (allocation.type === 'random') {
      const random = Math.random();
      
      let cumulative = 0;
      for (const variant of variants) {
        cumulative += (allocation.percentages[variant.id] || 0) / 100;
        if (random <= cumulative) {
          return variant;
        }
      }
    }
    
    // Default to control
    return variants.find(v => v.isControl) || variants[0] || null;
  }
  
  private async getVariantMetrics(
    experimentId: string,
    variantId: string
  ): Promise<Record<string, MetricStats>> {
    const result: Record<string, MetricStats> = {};
    
    if (!this.redis) return result;
    
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return result;
    
    const metricNames = [experiment.primaryMetric, ...experiment.secondaryMetrics];
    
    for (const metricName of metricNames) {
      const key = `${this.METRICS_PREFIX}:${experimentId}:${variantId}:${metricName}`;
      
      try {
        const data = await this.redis.zrange(key, 0, -1);
        const values = data.map(d => JSON.parse(d).value);
        
        if (values.length > 0) {
          result[metricName] = {
            mean: values.reduce((a, b) => a + b, 0) / values.length,
            stdDev: this.standardDeviation(values),
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          };
        }
        
      } catch (error) {
        this.logger.warn(`Failed to get metrics for ${metricName}: ${error}`);
      }
    }
    
    return result;
  }
  
  private zTest(
    mean1: number,
    std1: number,
    n1: number,
    mean2: number,
    std2: number,
    n2: number
  ): { significant: boolean; pValue: number } {
    if (n1 < 30 || n2 < 30) {
      return { significant: false, pValue: 1 };
    }
    
    const se = Math.sqrt((std1 * std1) / n1 + (std2 * std2) / n2);
    
    if (se === 0) {
      return { significant: false, pValue: 1 };
    }
    
    const z = (mean2 - mean1) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    
    return {
      significant: pValue < 0.05,
      pValue,
    };
  }
  
  private normalCDF(z: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);
    
    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
    
    return 0.5 * (1.0 + sign * y);
  }
  
  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquareDiff);
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }
  
  private getRecommendation(
    winner: string | null,
    significant: boolean,
    confidence: number
  ): string {
    if (!winner) {
      return 'No clear winner. Continue collecting data or increase sample size.';
    }
    
    if (!significant) {
      return `${winner} shows promise but results are not statistically significant yet.`;
    }
    
    if (confidence < 0.90) {
      return `${winner} is performing better (${(confidence * 100).toFixed(0)}% confidence). Consider running longer for higher confidence.`;
    }
    
    return `${winner} is the clear winner (${(confidence * 100).toFixed(0)}% confidence). Recommended for full rollout.`;
  }
}

// Interfaces
interface MetricStats {
  mean: number;
  stdDev: number;
  count: number;
  min: number;
  max: number;
}

interface VariantResult {
  variantId: string;
  variantName: string;
  isControl: boolean;
  metrics: Record<string, MetricStats>;
}

export interface ExperimentAnalysis {
  experimentId: string;
  experimentName: string;
  status: string;
  variantResults: VariantResult[];
  winningVariant: string | null;
  isSignificant: boolean;
  confidence: number;
  recommendation: string;
}







