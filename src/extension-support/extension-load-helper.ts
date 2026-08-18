import BlockType from "./block-type";
import ArgumentType from "./argument-type";
import TargetType from "./target-type";
import Cast from "../util/cast";
import Color from "../util/color";
import createTranslate from "./tw-l10n";
import log from "../util/log";
import Patcher from "./patcher";
import AsyncLimiter from "../util/async-limiter";
import VirtualMachine from "../virtual-machine";

// output a Scratch Object contains APIs all extension needed

let openVM: any = null;
let translate: any = null;

const clearScratchAPI = () => {
  delete globalThis.IIFEExtensionInfoList;
  if (globalThis.Scratch) {
    globalThis.Scratch.extensions = {
      unsandboxed: true,
      register: (extensionInstance: any) => {
        const info = extensionInstance.getInfo();
        throw new Error(
          `ScratchAPI: ${info.id} call extensions.register too late`,
        );
      },
    };
    // After an extension is loaded, we need to remove vm/runtime/renderer/etc.
    // from the global Scratch object. But the extension might still hold a reference
    // to the original object and access those properties later. To avoid breakage,
    // we clone the global Scratch object first, then only clear the global's APIs.
    globalThis.Scratch = { ...globalThis.Scratch };
    globalThis.Scratch.vm = null;
    globalThis.Scratch.runtime = null;
    globalThis.Scratch.renderer = null;
    // In theory, translate should also be nulled out, since each extension needs its own translate.
    // But we keep it for now to avoid errors from extensions that accidentally rely on it.
    // globalThis.Scratch.translate = null;

    // NOTE: The extension should either:
    // - keep a reference to the original Scratch object
    //     (e.g., IIFE style in TurboWarp: `((Scratch)=>{...})(window.Scratch)`,
    //      or simply `const Scratch = window.Scratch;` at the top)
    //   → the extension can still access vm/runtime/translate through the saved reference
    // or:
    // - not keep a reference, and always access via globalThis.Scratch
    //   → the extension must NOT access vm/runtime/translate through globalThis.Scratch
    //     (globalThis.Scratch only provides basic APIs like Cast, ArgumentType, etc.)
    //     vm/runtime are nulled out, and `globalThis.Scratch.translate` should also not be used,
    //     since it will be overwritten by the next extension
  }
};

const setupScratchAPI = (vm: VirtualMachine) => {
  const registerExt = (extensionInstance: any) => {
    const info = extensionInstance.getInfo();
    const extensionId = info.id;
    const extensionObject = {
      info: {
        name: info.name,
        extensionId,
      },
      Extension: () => extensionInstance.constructor,
    };
    globalThis.IIFEExtensionInfoList = globalThis.IIFEExtensionInfoList || [];
    globalThis.IIFEExtensionInfoList.push({
      extensionObject,
      extensionInstance,
    });
    return;
  };

  if (!openVM) {
    const { runtime } = vm;
    if (runtime.ccwAPI && runtime.ccwAPI.getOpenVM) {
      openVM = runtime.ccwAPI.getOpenVM();
    }
    openVM = {
      runtime: vm.runtime,
      exports: (vm as any).exports,
      ...(openVM as any),
    } as any;
  }
  // 需要重复创建，因为每个 extension 都需要一个独立的 translate
  translate = createTranslate(vm);

  // 需要创建新的 Scratch Object
  // 否则所有 extension 都共享一个 Scratch object → 共享同一个 translate
  globalThis.Scratch = {
    ArgumentType,
    BlockType,
    TargetType,
    Cast,
    Color,
    Patcher,
    translate,
    extensions: {
      unsandboxed: true,
      register: registerExt,
    },
    vm: openVM,
    runtime: (openVM as any).runtime,
    renderer: (openVM as any).runtime.renderer,
  };
};

interface ScriptWithCallbacks extends HTMLScriptElement {
  successCallBack: Array<(url: string) => void>;
  failedCallBack: Array<(error: any, url?: string) => void>;
}

const createdScriptLoader = ({
  url,
  onSuccess,
  onError,
}: {
  url: string;
  onSuccess: (url: string) => void;
  onError: (error: any, url?: string) => void;
}) => {
  if (!url) {
    return onError("remote extension url is null");
  }
  const exist = document.getElementById(url) as ScriptWithCallbacks | null;
  if (exist) {
    log.warn(`{url} remote extension script already loaded before`);
    exist.successCallBack.push(onSuccess);
    exist.failedCallBack.push(onError);
    return exist;
  }

  const script = document.createElement("script") as ScriptWithCallbacks;
  script.src = `${url + (url.includes("?") ? "&" : "?")}t=${Date.now()}`;
  script.id = url;
  script.defer = true;
  script.type = "module";

  script.successCallBack = [onSuccess];
  script.failedCallBack = [onError];

  let scriptError: any = null;
  const logError = (e: any) => {
    scriptError = e;
  };
  globalThis.addEventListener("error", logError);

  const removeScript = () => {
    globalThis.removeEventListener("error", logError);
    document.body.removeChild(script);
  };

  script.onload = () => {
    if (scriptError) {
      script.failedCallBack.forEach((cb) => cb?.(scriptError, url));
      script.failedCallBack = [];
    } else {
      script.successCallBack.forEach((cb) => cb(url));
      script.successCallBack = [];
    }
    removeScript();
  };

  script.onerror = (e: any) => {
    script.failedCallBack.forEach((cb) => cb?.(e, url));
    script.failedCallBack = [];
    removeScript();
  };

  try {
    document.body.append(script);
  } catch (error) {
    removeScript();
    log.error("load custom extension error:", error);
  }
  return script;
};

// Because setupScratchAPI requires messing with global state (globalThis.Scratch),
// only let one extension load at a time.
const limiter = new AsyncLimiter(
  async (vm: VirtualMachine, callback: () => Promise<any>) => {
    setupScratchAPI(vm);
    try {
      const res = await callback();
      return res;
    } finally {
      clearScratchAPI();
    }
  },
  1,
);
/**
 * Sets up the Scratch API and ensures that only one is executing at a time to prevent race conditions.
 * @async
 * @param {Object} vm - The virtual machine to use.
 * @param {() => Promise} callback - Async callback to execute with Scratch API.
 * @returns {Promise} - The promise that resolves when the callback completes.
 */
const withScratchAPI = async (
  vm: VirtualMachine,
  callback: () => Promise<any>,
) => limiter.do(vm, callback);

export { withScratchAPI, createdScriptLoader };
