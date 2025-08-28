// This file now re-exports the real authentication provider
// Keeping the same file for backwards compatibility with existing imports

export { AuthProvider, useAuth, AccountSelector } from './RealAuthProvider';

// Re-export types for convenience
export type { AuthUser } from './authService';