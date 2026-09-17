import type { BrainProvider, BrainInput, BrainOutput } from "../../contracts/brain";
export type TurnTransport = (body: BrainInput, signal: AbortSignal) => Promise<BrainOutput>;
export class AuroraLiteBrainAdapter implements BrainProvider {
  readonly id = "aurora-lite";
  constructor(private request: TurnTransport) {}
  generate(input: BrainInput, signal: AbortSignal) { return this.request(input, signal); }
}
