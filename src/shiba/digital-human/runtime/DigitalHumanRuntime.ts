import type { RuntimeEvent } from "../contracts/session";
export class DigitalHumanRuntime {
  private listeners = new Set<(event: RuntimeEvent) => void>();
  subscribe(fn: (event: RuntimeEvent) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  protected emit(event: RuntimeEvent) { this.listeners.forEach(fn => fn(event)); }
}
