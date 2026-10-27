export interface LoopDriver { request: (callback: FrameRequestCallback) => number; cancel: (id: number) => void }
/** Fixed 60Hz simulation; bounded catch-up never changes typing event timestamps. */
export class FixedLoop {
  private requestId: number | null = null;
  private last: number | null = null;
  private accumulator = 0;
  private running = false;
  readonly stepMs = 1000 / 60;
  constructor(private update: (dt: number) => void, private render: (alpha: number, frameMs: number) => void,
    private driver: LoopDriver = { request: callback => requestAnimationFrame(callback), cancel: id => cancelAnimationFrame(id) }) {}
  start(): void { if (this.running) return; this.running = true; this.requestId = this.driver.request(this.frame); }
  stop(): void { this.running = false; if (this.requestId !== null) this.driver.cancel(this.requestId); this.requestId = null; this.last = null; this.accumulator = 0; }
  private frame = (now: number) => {
    if (!this.running) return;
    this.requestId = null;
    const delta = this.last === null ? 0 : Math.max(0, Math.min(250, now - this.last));
    this.last = now;
    this.accumulator = Math.min(this.accumulator + delta, this.stepMs * 5);
    let count = 0;
    while (this.running && this.accumulator + 1e-7 >= this.stepMs && count++ < 5) { this.update(this.stepMs); this.accumulator -= this.stepMs; }
    if (!this.running) return;
    this.render(Math.max(0, this.accumulator / this.stepMs), delta);
    if (this.running) this.requestId = this.driver.request(this.frame);
  };
}
