import { ApolloClient, InMemoryCache, from } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import type { GraphQLError } from 'graphql';

/**
 * GraphQL endpoint
 */
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * HTTP Link para conectar con el servidor GraphQL
 */
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // Incluir cookies
});

/**
 * Auth Link para agregar el token a cada request
 * SetContextLink: (prevContext, operation) => newContext
 */
const authLink = new SetContextLink((prevContext) => {
  // Obtener token del localStorage
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('authToken') 
    : null;

  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

/**
 * Error Link para manejar errores globales
 */
const errorLink = new ErrorLink((error: any) => {
  const { graphQLErrors, networkError } = error;
  
  if (graphQLErrors) {
    graphQLErrors.forEach((err: any) => {
      console.error(
        `[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`,
        err.extensions
      );

      // Manejar errores de autenticación
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Redirigir al login o limpiar sesión
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          // window.location.href = '/login';
        }
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`);
  }
});

/**
 * Cache configuration
 */
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        search: {
          // Merge strategy para búsquedas
          keyArgs: ['query', 'filters'],
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

/**
 * Apollo Client instance
 */
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

/**
 * Helper para resetear el cache
 */
export const resetApolloCache = () => {
  return apolloClient.clearStore();
};
