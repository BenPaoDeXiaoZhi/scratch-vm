// Due to the existence of features such as interpolation and "0 FPS" being treated as "screen refresh rate",
// The VM loop logic has become much more complex

import type Runtime from "./runtime";

// Use setTimeout to polyfill requestAnimationFrame in Node.js environments
const _requestAnimationFrame =
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame
    : (f: () => void) => setTimeout(f, 1000 / 60);
const _cancelAnimationFrame =
  typeof requestAnimationFrame === "function"
    ? cancelAnimationFrame
    : clearTimeout;

const animationFrameWrapper = (callback: { (): void; (): void; (): void; }) => {
  let id: number | NodeJS.Timeout;
  const handle = () => {
    id = _requestAnimationFrame(handle);
    callback();
  };
  const cancel = () => _cancelAnimationFrame(id as number);
  id = _requestAnimationFrame(handle);
  return {
    cancel,
  };
};

class FrameLoop {
  runtime: any;
  running: boolean;
  framerate!: number;
  interpolation!: boolean;
  _stepInterval: any;
  _interpolationAnimation: any;
  _stepAnimation: any;

  constructor(runtime: Runtime){
    this.runtime = runtime;
    this.running = false;
    this.setFramerate(30);
    this.setInterpolation(false);

    this._stepInterval = null;
    this._interpolationAnimation = null;
    this._stepAnimation = null;
  }

  setFramerate(fps: number): void {
    this.framerate = fps;
    this._restart();
  }

  setInterpolation(interpolation: boolean): void {
    this.interpolation = interpolation;
    this._restart();
  }

  stepCallback() {
    this.runtime._step();
  }

  interpolationCallback(): void {
    this.runtime._renderInterpolatedPositions();
  }

  _restart(): void {
    if (this.running) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    this.running = true;
    if (this.framerate === 0) {
      this._stepAnimation = animationFrameWrapper(this.stepCallback.bind(this));
      this.runtime.currentStepTime = 1000 / 60;
    } else {
      // Interpolation should never be enabled when framerate === 0 as that's just redundant
      if (this.interpolation) {
        this._interpolationAnimation = animationFrameWrapper(
          this.interpolationCallback,
        );
      }
      this._stepInterval = setInterval(
        ()=>this.stepCallback(),
        1000 / this.framerate,
      );
      this.runtime.currentStepTime = 1000 / this.framerate;
    }
  }

  stop() {
    this.running = false;
    clearInterval(this._stepInterval);
    if (this._interpolationAnimation) {
      this._interpolationAnimation.cancel();
    }
    if (this._stepAnimation) {
      this._stepAnimation.cancel();
    }
    this._interpolationAnimation = null;
    this._stepAnimation = null;
  }
}

export default FrameLoop;
