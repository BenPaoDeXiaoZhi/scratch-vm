import ScratchCommon from "./tw-extension-api-common";
import createScratchX from "./tw-scratchx-compatibility-layer";
import AsyncLimiter from "../util/async-limiter";
import createTranslate from "./tw-l10n";
import staticFetch from "../util/tw-static-fetch";

/* eslint-disable require-await */

/**
 * Parse a URL object or return null.
 * @param {string} url
 * @returns {URL|null}
 */
const parseURL = (url: string) => {
  try {
    return new URL(url, location.href);
  } catch (e) {
    return null;
  }
};

/**
 * Sets up the globalThis.Scratch API for an unsandboxed extension.
 * @param {VirtualMachine} vm
 * @returns {Promise<object[]>} Resolves with a list of extension objects when Scratch.extensions.register is called.
 */
const setupUnsandboxedExtensionAPI = (vm: any) =>
  new Promise((resolve) => {
    const extensionObjects: any[] = [];
    const register = (extensionObject: any) => {
      extensionObjects.push(extensionObject);
      resolve(extensionObjects);
    };

    // Create a new copy of globalThis.Scratch for each extension
    const Scratch = Object.assign({}, globalThis.Scratch || {}, ScratchCommon);
    Scratch.extensions = {
      unsandboxed: true,
      register,
    };
    Scratch.vm = vm;
    Scratch.renderer = vm.runtime.renderer;

    Scratch.canFetch = async (url: string) => {
      const parsed = parseURL(url);
      if (!parsed) {
        return false;
      }
      // Always allow protocols that don't involve a remote request.
      if (parsed.protocol === "blob:" || parsed.protocol === "data:") {
        return true;
      }
      return vm.securityManager.canFetch(parsed.href);
    };

    Scratch.canOpenWindow = async (url: string) => {
      const parsed = parseURL(url);
      if (!parsed) {
        return false;
      }
      // Always reject protocols that would allow code execution.
      // eslint-disable-next-line no-script-url
      if (parsed.protocol === "javascript:") {
        return false;
      }
      return vm.securityManager.canOpenWindow(parsed.href);
    };

    Scratch.canRedirect = async (url: string) => {
      const parsed = parseURL(url);
      if (!parsed) {
        return false;
      }
      // Always reject protocols that would allow code execution.
      // eslint-disable-next-line no-script-url
      if (parsed.protocol === "javascript:") {
        return false;
      }
      return vm.securityManager.canRedirect(parsed.href);
    };

    Scratch.canRecordAudio = async () => vm.securityManager.canRecordAudio();

    Scratch.canRecordVideo = async () => vm.securityManager.canRecordVideo();

    Scratch.canReadClipboard = async () =>
      vm.securityManager.canReadClipboard();

    Scratch.canNotify = async () => vm.securityManager.canNotify();

    Scratch.canGeolocate = async () => vm.securityManager.canGeolocate();

    Scratch.canEmbed = async (url: string) => {
      const parsed = parseURL(url);
      if (!parsed) {
        return false;
      }
      return vm.securityManager.canEmbed(parsed.href);
    };

    Scratch.fetch = async (url: string | Request, options?: RequestInit) => {
      const actualURL = url instanceof Request ? url.url : url;

      const staticFetchResult = staticFetch(url);
      if (staticFetchResult) {
        return staticFetchResult;
      }

      if (!(await Scratch.canFetch(actualURL))) {
        throw new Error(`Permission to fetch ${actualURL} rejected.`);
      }
      return fetch(url, options);
    };

    Scratch.openWindow = async (url: string, features?: string) => {
      if (!(await Scratch.canOpenWindow(url))) {
        throw new Error(`Permission to open tab ${url} rejected.`);
      }
      // Use noreferrer to prevent new tab from accessing `window.opener`
      const baseFeatures = "noreferrer";
      features = features ? `${baseFeatures},${features}` : baseFeatures;
      return window.open(url, "_blank", features);
    };

    Scratch.redirect = async (url: string) => {
      if (!(await Scratch.canRedirect(url))) {
        throw new Error(`Permission to redirect to ${url} rejected.`);
      }
      location.href = url;
    };

    Scratch.translate = createTranslate(vm);

    globalThis.Scratch = Scratch;
    globalThis.ScratchExtensions = createScratchX(Scratch);

    vm.emit("CREATE_UNSANDBOXED_EXTENSION_API", Scratch);
  });

/**
 * Disable the existing globalThis.Scratch unsandboxed extension APIs.
 * This helps debug poorly designed extensions.
 */
const teardownUnsandboxedExtensionAPI = () => {
  // We can assume globalThis.Scratch already exists.
  globalThis.Scratch.extensions.register = () => {
    throw new Error("Too late to register new extensions.");
  };
};

/**
 * Load an unsandboxed extension from an arbitrary URL. This is dangerous.
 * @param {string} extensionURL
 * @param {Virtualmachine} vm
 * @returns {Promise<object[]>} Resolves with a list of extension objects if the extension was loaded successfully.
 */
const loadUnsandboxedExtension = (extensionURL: string, vm: any) =>
  new Promise((resolve, reject) => {
    setupUnsandboxedExtensionAPI(vm).then(resolve);

    const script = document.createElement("script");
    script.onerror = () => {
      reject(
        new Error(
          `Error in unsandboxed script ${extensionURL}. Check the console for more information.`,
        ),
      );
    };
    script.src = extensionURL;
    document.body.appendChild(script);
  }).then((objects: any) => {
    teardownUnsandboxedExtensionAPI();
    return objects;
  });

// Because loading unsandboxed extensions requires messing with global state (globalThis.Scratch),
// only let one extension load at a time.
const limiter = new AsyncLimiter(loadUnsandboxedExtension, 1);
const load = (extensionURL: string, vm: any) => limiter.do(extensionURL, vm);

export { setupUnsandboxedExtensionAPI, load };
