export interface ProcessedImage {
  originalData: string; // Base64
  mimeType: string;
  generatedData?: string; // Base64
  prompt: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GenerationConfig {
  aspectRatio?: string;
  numberOfImages?: number;
}
