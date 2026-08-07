import Timer from "../util/timer";

class Clock {
  _projectTimer: Timer;
  _pausedTime: number | null;
  _paused: boolean;
  /**
   * Reference to the owning Runtime.
   * @type{!Runtime}
   */
  runtime: any;

  constructor(runtime: any) {
    this._projectTimer = new Timer({ now: () => runtime.currentMSecs });
    this._projectTimer.start();
    this._pausedTime = null;
    this._paused = false;
    /**
     * Reference to the owning Runtime.
     * @type{!Runtime}
     */
    this.runtime = runtime;
  }

  projectTimer(): number {
    if (this._paused) {
      return (this._pausedTime ?? 0) / 1000;
    }
    return this._projectTimer.timeElapsed() / 1000;
  }

  pause(): void {
    this._paused = true;
    this._pausedTime = this._projectTimer.timeElapsed();
  }

  resume(): void {
    this._paused = false;
    const dt = this._projectTimer.timeElapsed() - this._pausedTime;
    this._projectTimer.startTime += dt;
  }

  resetProjectTimer(): void {
    this._projectTimer.start();
  }
}

export default Clock;
