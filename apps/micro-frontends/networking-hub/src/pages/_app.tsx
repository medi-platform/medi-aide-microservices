import type { AppProps } from 'next/app';
import React from 'react';
import dynamic from 'next/dynamic';
import { ChakraProvider } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const ShellProviders: React.ComponentType<React.PropsWithChildren<{}>> = dynamic(
  () => import('shell/AuthProvider'),
  { ssr: false }
) as any;
const GlobalState = dynamic(() => import('shell/GlobalState'), { ssr: false });

class AppErrorBoundary extends React.Component<React.PropsWithChildren<{}>, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.error('MFE ErrorBoundary caught:', err); }
  render() { return this.state.hasError ? null : (this.props.children as any); }
}

export default function App({ Component, pageProps }: AppProps) {
  if (typeof window === 'undefined') {
    return <Component {...pageProps} />;
  }
  return (
    <AppErrorBoundary>
      <ShellProviders>
        <ChakraProvider>
          <GlobalStateBridge />
          <Component {...pageProps} />
        </ChakraProvider>
      </ShellProviders>
    </AppErrorBoundary>
  );
}

export function reportWebVitals(metric: any) {
  if (process.env.NEXT_PUBLIC_RUM_ENDPOINT) {
    try {
      navigator.sendBeacon?.(
        process.env.NEXT_PUBLIC_RUM_ENDPOINT,
        JSON.stringify({ app: 'networking-hub', metric })
      );
    } catch {}
  }
}

function GlobalStateBridge() {
  const [mod, setMod] = useState<any>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await import('shell/GlobalState');
      if (!cancelled) setMod(m);
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!mod?.useRegisterInitialState) return;
    mod.useRegisterInitialState({ 'mfe.networking.ready': true });
  }, [mod]);
  return null;
}


