'use client';

import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
import { apolloClient } from './apollo-client';

interface ApolloProviderProps {
  children: React.ReactNode;
}

/**
 * Apollo Provider para envolver la aplicación
 * Proporciona el cliente GraphQL a todos los componentes
 * 
 * @example
 * <ApolloProvider>
 *   <App />
 * </ApolloProvider>
 */
export function ApolloProvider({ children }: ApolloProviderProps) {
  return (
    <BaseApolloProvider client={apolloClient}>
      {children}
    </BaseApolloProvider>
  );
}
