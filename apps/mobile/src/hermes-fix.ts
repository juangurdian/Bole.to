/**
 * Minimal Hermes property fix for React Native 0.81.4
 * Only handles the specific "property is not configurable" error
 */

// Save original before any modifications
const originalDefineProperty = Object.defineProperty;

// Minimal interceptor - only catch configurable property errors  
Object.defineProperty = function(target: any, property: PropertyKey, descriptor: PropertyDescriptor) {
  try {
    return originalDefineProperty(target, property, descriptor);
  } catch (error: any) {
    if (error?.message?.includes('not configurable')) {
      // Silent ignore - just return the target to prevent crashes
      console.warn(`[Hermes Fix] Skipped non-configurable property: ${String(property)}`);
      return target;
    }
    throw error;
  }
};

// Global error boundary for runtime errors
if (typeof global !== 'undefined' && global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.setGlobalHandler;
  global.ErrorUtils.setGlobalHandler = function(handler) {
    return originalHandler?.((error: any, isFatal: boolean) => {
      if (error?.message?.includes('property is not configurable')) {
        console.warn('[Hermes Fix] Intercepted configurable property runtime error');
        return; // Don't crash the app
      }
      return handler?.(error, isFatal);
    });
  };
}