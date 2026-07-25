import type { SafeTrace, TelemetryProvider } from "@/server/telemetry/types";

export class InMemoryTelemetryProvider implements TelemetryProvider {
  private readonly traces: SafeTrace[] = [];

  public constructor(private readonly maxTraces = 1000) {}

  public async trace(event: SafeTrace): Promise<void> {
    this.traces.push({
      ...event,
      retrievedChunkIds: [...event.retrievedChunkIds],
      citedChunkIds: [...event.citedChunkIds],
      timings: { ...event.timings },
    });
    if (this.traces.length > this.maxTraces) this.traces.shift();
  }

  public snapshot(): SafeTrace[] {
    return this.traces.map((trace) => ({ ...trace, retrievedChunkIds: [...trace.retrievedChunkIds], citedChunkIds: [...trace.citedChunkIds], timings: { ...trace.timings } }));
  }
}

export class NoopTelemetryProvider implements TelemetryProvider {
  public async trace(event: SafeTrace): Promise<void> {
    void event;
  }
}

export const telemetry = new InMemoryTelemetryProvider();
