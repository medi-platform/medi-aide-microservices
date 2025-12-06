import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

export interface WebVitalsConfig {
  onMetric?: (metric: Metric) => void;
  reportToEndpoint?: string;
  includedMetrics?: Array<'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP'>;
}

export class WebVitalsService {
  private metrics: Record<string, Metric> = {};
  
  constructor(private config: WebVitalsConfig = {}) {
    this.initializeVitals();
  }

  private initializeVitals() {
    const metrics = this.config.includedMetrics || ['CLS', 'FCP', 'FID', 'LCP', 'TTFB', 'INP'];
    
    const handleMetric = (metric: Metric) => {
      this.metrics[metric.name] = metric;
      
      // Call custom handler if provided
      if (this.config.onMetric) {
        this.config.onMetric(metric);
      }
      
      // Report to endpoint if configured
      if (this.config.reportToEndpoint) {
        this.reportMetric(metric);
      }
    };

    if (metrics.includes('CLS')) onCLS(handleMetric);
    if (metrics.includes('FCP')) onFCP(handleMetric);
    if (metrics.includes('FID')) onFID(handleMetric);
    if (metrics.includes('LCP')) onLCP(handleMetric);
    if (metrics.includes('TTFB')) onTTFB(handleMetric);
    if (metrics.includes('INP')) onINP(handleMetric);
  }

  private async reportMetric(metric: Metric) {
    if (!this.config.reportToEndpoint) return;

    try {
      await fetch(this.config.reportToEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          navigationType: metric.navigationType,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Failed to report web vital:', error);
    }
  }

  getMetrics(): Record<string, Metric> {
    return { ...this.metrics };
  }

  getMetric(name: string): Metric | undefined {
    return this.metrics[name];
  }
}
