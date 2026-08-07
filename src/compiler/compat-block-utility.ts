import BlockUtility from "../engine/block-utility";

class CompatibilityLayerBlockUtility extends BlockUtility {
  /**
   * @type {[number, boolean] | null}
   * @private
   */
  _startedBranch: [number, boolean] | null;

  constructor() {
    super();
    this._startedBranch = null;
  }

  get stackFrame() {
    return this.thread.compatibilityStackFrame;
  }

  /**
   * @param {number} branchNumber
   * @param {boolean} isLoop
   */
  startBranch(branchNumber: number, isLoop: boolean) {
    this._startedBranch = [branchNumber, isLoop];
  }

  startProcedure() {
    throw new Error("startProcedure is not supported by this BlockUtility");
  }

  // Parameters are not used by compiled scripts.
  initParams() {
    throw new Error("initParams is not supported by this BlockUtility");
  }
  pushParam() {
    throw new Error("pushParam is not supported by this BlockUtility");
  }
  getParam() {
    throw new Error("getParam is not supported by this BlockUtility");
  }

  /**
   * @param {any} thread
   * @param {string} fakeBlockId
   * @param {any} stackFrame
   */
  init(thread: any, fakeBlockId: string, stackFrame: any) {
    this.thread = thread;
    this.sequencer = thread.target.runtime.sequencer;
    this._startedBranch = null;
    thread.stack[0] = fakeBlockId;
    thread.compatibilityStackFrame = stackFrame;
  }
}

// Export a single instance to be reused.

export default new CompatibilityLayerBlockUtility();
