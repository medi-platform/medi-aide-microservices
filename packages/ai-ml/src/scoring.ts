/**
 * Scoring Utilities for AI/ML Features
 * Common scoring algorithms and calculations
 */

/**
 * Calculate weighted score from multiple factors
 */
export function calculateWeightedScore(
  factors: { value: number; weight: number }[],
): number {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.value * f.weight, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Normalize value to 0-1 range
 */
export function normalize(
  value: number,
  min: number,
  max: number,
): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate exponential decay
 */
export function exponentialDecay(
  value: number,
  halfLife: number,
  timePassed: number,
): number {
  return value * Math.pow(0.5, timePassed / halfLife);
}

/**
 * Calculate percentile rank
 */
export function percentileRank(
  value: number,
  distribution: number[],
): number {
  if (distribution.length === 0) return 50;
  const sorted = [...distribution].sort((a, b) => a - b);
  const below = sorted.filter((v) => v < value).length;
  return (below / sorted.length) * 100;
}

/**
 * Calculate z-score
 */
export function zScore(
  value: number,
  mean: number,
  stdDev: number,
): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate moving average
 */
export function movingAverage(
  values: number[],
  windowSize: number,
): number[] {
  if (values.length < windowSize) return [average(values)];

  const result: number[] = [];
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    result.push(average(window));
  }
  return result;
}

/**
 * Calculate average
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(
  vectorA: number[],
  vectorB: number[],
): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must be same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function jaccardSimilarity<T>(
  setA: Set<T> | T[],
  setB: Set<T> | T[],
): number {
  const a = Array.isArray(setA) ? new Set(setA) : setA;
  const b = Array.isArray(setB) ? new Set(setB) : setB;

  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate skill overlap score
 */
export function skillOverlapScore(
  required: string[],
  available: string[],
): number {
  if (required.length === 0) return 1;

  const requiredLower = required.map((s) => s.toLowerCase());
  const availableLower = available.map((s) => s.toLowerCase());

  const matched = requiredLower.filter((r) =>
    availableLower.some(
      (a) => a.includes(r) || r.includes(a),
    ),
  );

  return matched.length / required.length;
}

/**
 * Calculate time-decay weighted score
 */
export function timeDecayScore(
  events: { value: number; timestamp: Date }[],
  decayDays: number = 30,
  now: Date = new Date(),
): number {
  if (events.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const event of events) {
    const daysPassed = (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-daysPassed / decayDays);
    weightedSum += event.value * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Risk score calculation
 */
export function calculateRiskScore(
  factors: { name: string; value: number; weight: number; threshold?: number }[],
): { score: number; level: 'low' | 'medium' | 'high' | 'critical'; contributingFactors: string[] } {
  let score = 0;
  const contributingFactors: string[] = [];

  for (const factor of factors) {
    const contribution = factor.value * factor.weight;
    score += contribution;

    if (factor.threshold !== undefined && factor.value > factor.threshold) {
      contributingFactors.push(factor.name);
    } else if (contribution > 0.1) {
      contributingFactors.push(factor.name);
    }
  }

  // Normalize score to 0-1
  score = Math.max(0, Math.min(1, score));

  let level: 'low' | 'medium' | 'high' | 'critical';
  if (score >= 0.75) level = 'critical';
  else if (score >= 0.5) level = 'high';
  else if (score >= 0.25) level = 'medium';
  else level = 'low';

  return { score, level, contributingFactors };
}

/**
 * Confidence interval calculation
 */
export function confidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95,
): { mean: number; lower: number; upper: number; margin: number } {
  const n = values.length;
  if (n < 2) {
    const mean = n === 1 ? values[0] : 0;
    return { mean, lower: mean, upper: mean, margin: 0 };
  }

  const mean = average(values);
  const stdDev = standardDeviation(values);
  const standardError = stdDev / Math.sqrt(n);

  // Z-score for 95% confidence
  const zScores: Record<number, number> = {
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  const z = zScores[confidenceLevel] || 1.96;

  const margin = z * standardError;

  return {
    mean,
    lower: mean - margin,
    upper: mean + margin,
    margin,
  };
}
