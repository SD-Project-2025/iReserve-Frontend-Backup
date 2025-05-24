/// <reference types="vite/client" />
declare namespace NodeJS {
  interface ProcessEnv {
    VITE_API_URL: string;
    VITE_GOOGLE_MAPS_API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}