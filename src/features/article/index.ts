/**
 * Article Feature Main Index
 *
 * Barrel export for the entire article feature module
 * Following DDD + Clean Architecture principles
 */

// Domain layer - Interfaces and types
export * from './interfaces'

// Infrastructure layer - Data and services
export * from './data'
export * from './services'

// Application layer - Hooks
export * from './hooks'

// Application layer - Stores
export * from './stores'

// Presentation layer - Components
export * from './components'

// Utility functions
export * from './utils'
