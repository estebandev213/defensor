export interface SafeTrace {
  traceId: string;
  timestamp: string;
  route: string;
  category?: string;
  coverageStatus?: string;
  timings: Record<string, number>;
  retrievedChunkIds: string[];
  evidenceDecision?: string;
  citedChunkIds: string[];
  errorCode?: string;
}

export interface TelemetryProvider {
  trace(event: SafeTrace): Promise<void>;
}
