declare module 'shell/AuthProvider' {
  const Component: React.ComponentType<React.PropsWithChildren<{}>>;
  export default Component;
}

declare module 'shell/GlobalState' {
  export function useRegisterInitialState(initialState: Record<string, any>): void;
  const mod: any;
  export default mod;
}


