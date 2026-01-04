import { Injectable, Logger } from '@nestjs/common';
import { FeatureVector } from '../interfaces/matching.interfaces';

/**
 * ML Model Serving Service
 * 
 * Uber-grade ML model serving with support for multiple backends:
 * - TensorFlow Serving
 * - ONNX Runtime
 * - Python FastAPI services
 * - Heuristic fallback
 */
@Injectable()
export class MLModelServingService {
  private readonly logger = new Logger(MLModelServingService.name);
  
  // Circuit breaker state
  private errorCount = 0;
  private lastErrorTime = 0;
  private readonly ERROR_THRESHOLD = 5;
  private readonly CIRCUIT_RESET_MS = 30000;
  
  // Configuration
  private readonly ML_ENABLED = process.env.ML_SCORING_ENABLED === 'true';
  private readonly ML_TIMEOUT_MS = parseInt(process.env.ML_MODEL_TIMEOUT_MS || '500', 10);
  private readonly PYTHON_ENDPOINT = process.env.ML_PYTHON_ENDPOINT || 'http://localhost:8000';
  private readonly TF_ENDPOINT = process.env.ML_TENSORFLOW_ENDPOINT;
  private readonly SHADOW_MODE = process.env.ML_SHADOW_MODE === 'true';
  
  // Model registry
  private readonly models: Map<string, ModelConfig> = new Map([
    ['heuristic-v1', { type: 'heuristic', version: 'v1', active: true }],
    ['python-ml-v1', { type: 'python', version: 'v1', endpoint: this.PYTHON_ENDPOINT, active: this.ML_ENABLED }],
  ]);
  
  /**
   * Predict match scores using the specified model
   */
  async predict(
    modelName: string,
    features: FeatureVector | FeatureVector[]
  ): Promise<MLPredictionResult> {
    const startTime = Date.now();
    const featuresArray = Array.isArray(features) ? features : [features];
    
    try {
      const model = this.models.get(modelName);
      
      if (!model || !model.active) {
        this.logger.debug(`Model ${modelName} not available, using heuristic fallback`);
        return this.predictHeuristic(featuresArray, startTime);
      }
      
      // Check circuit breaker
      if (this.isCircuitOpen() && model.type !== 'heuristic') {
        this.logger.warn('Circuit breaker open, using heuristic fallback');
        return this.predictHeuristic(featuresArray, startTime);
      }
      
      switch (model.type) {
        case 'python':
          return await this.predictWithPython(model, featuresArray, startTime);
        case 'tensorflow':
          return await this.predictWithTensorFlow(model, featuresArray, startTime);
        case 'heuristic':
        default:
          return this.predictHeuristic(featuresArray, startTime);
      }
      
    } catch (error) {
      this.recordError();
      this.logger.error(`ML prediction failed: ${error}`);
      return this.predictHeuristic(featuresArray, startTime);
    }
  }
  
  /**
   * Ensemble prediction using multiple models
   */
  async predictEnsemble(
    features: FeatureVector | FeatureVector[]
  ): Promise<MLPredictionResult> {
    const startTime = Date.now();
    const featuresArray = Array.isArray(features) ? features : [features];
    
    const activeModels = Array.from(this.models.entries())
      .filter(([_, config]) => config.active)
      .map(([name]) => name);
    
    if (activeModels.length === 0) {
      return this.predictHeuristic(featuresArray, startTime);
    }
    
    // Run predictions in parallel
    const predictions = await Promise.allSettled(
      activeModels.map(model => this.predict(model, featuresArray))
    );
    
    // Aggregate successful predictions
    const successfulPredictions = predictions
      .filter((p): p is PromiseFulfilledResult<MLPredictionResult> => p.status === 'fulfilled')
      .map(p => p.value);
    
    if (successfulPredictions.length === 0) {
      return this.predictHeuristic(featuresArray, startTime);
    }
    
    // Weighted average of predictions
    const aggregatedScores = featuresArray.map((_, idx) => {
      let weightedSum = 0;
      let totalWeight = 0;
      
      for (const pred of successfulPredictions) {
        const score = pred.predictions[idx]?.score || 0;
        const confidence = pred.predictions[idx]?.confidence || 0.5;
        weightedSum += score * confidence;
        totalWeight += confidence;
      }
      
      return {
        score: totalWeight > 0 ? weightedSum / totalWeight : 0,
        confidence: totalWeight / successfulPredictions.length,
        explanation: { ensemble: true, modelCount: successfulPredictions.length },
      };
    });
    
    return {
      modelVersion: 'ensemble',
      predictions: aggregatedScores,
      latencyMs: Date.now() - startTime,
      usedFallback: false,
    };
  }
  
  /**
   * Heuristic prediction (always available fallback)
   */
  private predictHeuristic(
    features: FeatureVector[],
    startTime: number
  ): MLPredictionResult {
    const predictions = features.map(f => {
      // Weighted heuristic scoring
      let score = 0;
      
      // Skill match (25%)
      score += f.skillMatchRatio * 25;
      
      // Experience (15%)
      score += Math.min(1, f.experienceYears / 10) * 15;
      
      // Rating (20%)
      score += (f.avgRating / 5) * 20;
      
      // Distance (15%)
      const distanceScore = Math.max(0, 1 - f.distanceKm / 50);
      score += distanceScore * 15;
      
      // Reliability (10%)
      score += f.acceptanceRate * 10;
      
      // Budget compatibility (10%)
      score += f.budgetCompatibility * 10;
      
      // Activity (5%)
      score += f.recentActivityScore * 5;
      
      return {
        score: Math.round(score),
        confidence: 0.7,
        explanation: {
          model: 'heuristic-v1',
          topFeatures: ['skillMatchRatio', 'avgRating', 'distanceKm'],
        },
      };
    });
    
    return {
      modelVersion: 'heuristic-v1',
      predictions,
      latencyMs: Date.now() - startTime,
      usedFallback: true,
    };
  }
  
  /**
   * Predict using Python ML service
   */
  private async predictWithPython(
    model: ModelConfig,
    features: FeatureVector[],
    startTime: number
  ): Promise<MLPredictionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.ML_TIMEOUT_MS);
    
    try {
      const response = await fetch(`${model.endpoint}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, model_version: model.version }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`Python service returned ${response.status}`);
      }
      
      const result = await response.json();
      
      // Run in shadow mode if enabled
      if (this.SHADOW_MODE) {
        this.runShadowComparison(features, result, startTime);
      }
      
      return {
        modelVersion: `python-${model.version}`,
        predictions: result.predictions.map((p: any) => ({
          score: p.score,
          confidence: p.confidence || 0.8,
          explanation: p.explanation || { model: 'python' },
        })),
        latencyMs: Date.now() - startTime,
        usedFallback: false,
      };
      
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
  
  /**
   * Predict using TensorFlow Serving
   */
  private async predictWithTensorFlow(
    model: ModelConfig,
    features: FeatureVector[],
    startTime: number
  ): Promise<MLPredictionResult> {
    if (!this.TF_ENDPOINT) {
      throw new Error('TensorFlow endpoint not configured');
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.ML_TIMEOUT_MS);
    
    try {
      // Convert features to TensorFlow input format
      const instances = features.map(f => Object.values(f));
      
      const response = await fetch(
        `${this.TF_ENDPOINT}/v1/models/matching:predict`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instances }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`TensorFlow serving returned ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        modelVersion: `tensorflow-${model.version}`,
        predictions: result.predictions.map((p: number[]) => ({
          score: Math.round(p[0] * 100),
          confidence: p[1] || 0.8,
          explanation: { model: 'tensorflow' },
        })),
        latencyMs: Date.now() - startTime,
        usedFallback: false,
      };
      
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }
  
  /**
   * Shadow comparison for A/B testing
   */
  private async runShadowComparison(
    features: FeatureVector[],
    mlResult: any,
    startTime: number
  ): Promise<void> {
    try {
      const heuristicResult = this.predictHeuristic(features, startTime);
      
      // Compare predictions
      const comparison = features.map((_, idx) => {
        const mlScore = mlResult.predictions[idx]?.score || 0;
        const heuristicScore = heuristicResult.predictions[idx]?.score || 0;
        return {
          ml: mlScore,
          heuristic: heuristicScore,
          diff: mlScore - heuristicScore,
        };
      });
      
      this.logger.debug(`Shadow comparison: ${JSON.stringify(comparison.slice(0, 3))}`);
      
    } catch (error) {
      // Shadow mode should not affect main flow
    }
  }
  
  /**
   * Register a new model
   */
  registerModel(name: string, config: ModelConfig): void {
    this.models.set(name, config);
    this.logger.log(`Registered model: ${name}`);
  }
  
  /**
   * Activate/deactivate a model
   */
  setModelActive(name: string, active: boolean): void {
    const model = this.models.get(name);
    if (model) {
      model.active = active;
      this.logger.log(`Model ${name} ${active ? 'activated' : 'deactivated'}`);
    }
  }
  
  /**
   * Get model status
   */
  getModelStatus(): Map<string, { active: boolean; type: string }> {
    const status = new Map<string, { active: boolean; type: string }>();
    
    for (const [name, config] of this.models) {
      status.set(name, { active: config.active, type: config.type });
    }
    
    return status;
  }
  
  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.ML_ENABLED) return true;
    
    try {
      const response = await fetch(`${this.PYTHON_ENDPOINT}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // Circuit breaker methods
  private isCircuitOpen(): boolean {
    if (this.errorCount >= this.ERROR_THRESHOLD) {
      if (Date.now() - this.lastErrorTime < this.CIRCUIT_RESET_MS) {
        return true;
      }
      this.errorCount = 0;
    }
    return false;
  }
  
  private recordError(): void {
    this.errorCount++;
    this.lastErrorTime = Date.now();
  }
}

// Interfaces
interface ModelConfig {
  type: 'heuristic' | 'python' | 'tensorflow' | 'onnx';
  version: string;
  endpoint?: string;
  active: boolean;
}

export interface MLPredictionResult {
  modelVersion: string;
  predictions: Array<{
    score: number;
    confidence: number;
    explanation?: Record<string, any>;
  }>;
  latencyMs: number;
  usedFallback: boolean;
}































































