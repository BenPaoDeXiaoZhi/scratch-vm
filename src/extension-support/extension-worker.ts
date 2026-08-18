import ScratchCommon from "./tw-extension-api-common";
import createScratchX from "./tw-scratchx-compatibility-layer";
import dispatch from "../dispatch/worker-dispatch";
import log from "../util/log";
import { isWorker } from "./tw-extension-worker-context";
import createTranslate from "./tw-l10n";

/* eslint-env worker */

declare function importScripts(url: string): void;

const translate = createTranslate(null);

const loadScripts = (url: string) => {
  if (isWorker) {
    importScripts(url);
  } else {
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.onload = () => resolve();
      script.onerror = () => {
        reject(
          new Error(
            `Error in sandboxed script: ${url}. Check the console for more information.`,
          ),
        );
      };
      script.src = url;
      document.body.appendChild(script);
    });
  }
};

class ExtensionWorker {
  nextExtensionId: number;
  initialRegistrations: Promise<any>[] | null;
  firstRegistrationPromise: Promise<any>;
  firstRegistrationCallback: ((value?: any) => void) | null = null;
  workerId: number | null = null;
  extensions: any[];

  constructor() {
    this.nextExtensionId = 0;

    this.initialRegistrations = [];

    this.firstRegistrationPromise = new Promise((resolve) => {
      this.firstRegistrationCallback = resolve;
    });

    dispatch.waitForConnection.then(() => {
      dispatch.call("extensions", "allocateWorker").then(async (x) => {
        const [id, extension] = x;
        this.workerId = id;

        try {
          await loadScripts(extension);
          await this.firstRegistrationPromise;

          const initialRegistrations = this.initialRegistrations;
          this.initialRegistrations = null;

          Promise.all(initialRegistrations as Promise<any>[]).then(() =>
            dispatch.call("extensions", "onWorkerInit", id),
          );
        } catch (e) {
          log.error(e);
          dispatch.call("extensions", "onWorkerInit", id, `${e}`);
        }
      });
    });

    this.extensions = [];
  }

  register(extensionObject: any) {
    const extensionId = this.nextExtensionId++;
    this.extensions.push(extensionObject);
    const serviceName = `extension.${this.workerId}.${extensionId}`;
    const promise = dispatch
      .setService(serviceName, extensionObject)
      .then(() =>
        dispatch.call("extensions", "registerExtensionService", serviceName),
      );
    if (this.initialRegistrations) {
      if (this.firstRegistrationCallback) {
        this.firstRegistrationCallback();
      }
      this.initialRegistrations.push(promise);
    }
    return promise;
  }
}

globalThis.Scratch = globalThis.Scratch || {};
Object.assign(globalThis.Scratch, ScratchCommon, {
  canFetch: () => Promise.resolve(true),
  fetch: (url: string, options?: any) => fetch(url, options),
  canOpenWindow: () => Promise.resolve(false),
  openWindow: () =>
    Promise.reject(
      new Error("Scratch.openWindow not supported in sandboxed extensions"),
    ),
  canRedirect: () => Promise.resolve(false),
  redirect: () =>
    Promise.reject(
      new Error("Scratch.redirect not supported in sandboxed extensions"),
    ),
  canRecordAudio: () => Promise.resolve(false),
  canRecordVideo: () => Promise.resolve(false),
  canReadClipboard: () => Promise.resolve(false),
  canNotify: () => Promise.resolve(false),
  canGeolocate: () => Promise.resolve(false),
  canEmbed: () => Promise.resolve(false),
  translate,
});

/**
 * Expose only specific parts of the worker to extensions.
 */
const extensionWorker = new ExtensionWorker();
globalThis.Scratch.extensions = {
  register: extensionWorker.register.bind(extensionWorker),
};

globalThis.ScratchExtensions = createScratchX(globalThis.Scratch);
