declare global {
  namespace globalThis {
    var $monitoringVariable: boolean;
  }

  interface Window {
    /**
     * Global object used by the playground/benchmark page to expose the
     * Scratch VM, renderer, and related internals for debugging.
     */
    Scratch: {
      vm: any;
      renderer: any;
      [key: string]: any;
    };
    /** Timestamp (ms) when the VM finished evaluating benchmark.js. */
    ScratchVMEvalEnd: number;
    /** Timestamp (ms) when the initial project data finished loading. */
    ScratchVMLoadDataEnd: number;
    /** Timestamp (ms) when all project assets finished downloading. */
    ScratchVMDownloadEnd: number;
    /** Timestamp (ms) when the project finished hydrating/loading. */
    ScratchVMLoadEnd: number;
    /** Timestamp (ms) marking the start of the load process. */
    ScratchVMLoadStart: number;
  }
}
export {};
