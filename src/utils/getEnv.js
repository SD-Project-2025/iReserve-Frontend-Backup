export function getEnvVar(key) {
  // Prefer import.meta.env in browser or Vite context
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }
  // Fallback for Node/test (Jest)
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  return undefined;
}