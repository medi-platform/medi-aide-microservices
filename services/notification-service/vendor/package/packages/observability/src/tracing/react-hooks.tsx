'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { WebTracerService } from './web-tracer';
import { Span } from '@opentelemetry/api';

interface TracingContextValue {
  tracer: WebTracerService;
  startSpan: (name: string, attributes?: Record<string, any>) => Span;
  withSpan: <T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, any>
  ) => Promise<T>;
}

const TracingContext = createContext<TracingContextValue | null>(null);

export interface TracingProviderProps {
  children: React.ReactNode;
  serviceName: string;
  serviceVersion?: string;
  endpoint?: string;
  userId?: string;
}

export function TracingProvider({
  children,
  serviceName,
  serviceVersion,
  endpoint,
  userId,
}: TracingProviderProps) {
  const tracerRef = useRef<WebTracerService>();

  if (!tracerRef.current) {
    tracerRef.current = new WebTracerService({
      serviceName,
      serviceVersion,
      endpoint,
      userId,
    });
  }

  useEffect(() => {
    if (userId && tracerRef.current) {
      tracerRef.current.setUserId(userId);
    }
  }, [userId]);

  const startSpan = useCallback(
    (name: string, attributes?: Record<string, any>) => {
      return tracerRef.current!.startSpan(name, attributes);
    },
    []
  );

  const withSpan = useCallback(
    async <T,>(
      name: string,
      fn: (span: Span) => Promise<T>,
      attributes?: Record<string, any>
    ) => {
      return tracerRef.current!.withSpan(name, fn, attributes);
    },
    []
  );

  return (
    <TracingContext.Provider
      value={{
        tracer: tracerRef.current,
        startSpan,
        withSpan,
      }}
    >
      {children}
    </TracingContext.Provider>
  );
}

export function useTracing() {
  const context = useContext(TracingContext);
  if (!context) {
    throw new Error('useTracing must be used within a TracingProvider');
  }
  return context;
}

export function useTrace() {
  const { withSpan, startSpan } = useTracing();

  const trace = useCallback(
    async <T,>(
      name: string,
      fn: () => Promise<T>,
      attributes?: Record<string, any>
    ): Promise<T> => {
      return withSpan(name, () => fn(), attributes);
    },
    [withSpan]
  );

  const traceSync = useCallback(
    <T,>(name: string, fn: () => T, attributes?: Record<string, any>): T => {
      const span = startSpan(name, attributes);
      try {
        const result = fn();
        span.setStatus({ code: 0 }); // OK
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2 }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    },
    [startSpan]
  );

  return { trace, traceSync };
}
