// Vitest shim for the `server-only` package. Next.js ships this as a build-time
// marker that throws if imported into a client bundle; under vitest we just
// need it to resolve without side effects.
export {};
