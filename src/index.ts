// Scratch-parser's unpack.js (a CommonJS dependency inside node_modules)
// references the global `Buffer` object directly. In browser environments
// Buffer is not defined, so expose a Buffer polyfill on the global object.
import { Buffer as BufferPolyfill } from "buffer";

const global: any =
  typeof globalThis !== "undefined" ? globalThis : (window as any);
if (!global.Buffer) {
  global.Buffer = BufferPolyfill;
}

globalThis.global = global;

import VirtualMachine from "./virtual-machine";
export default VirtualMachine;

export { type default as ExtensionManager } from "./extension-support/extension-manager";
export { type default as Runtime } from "./engine/runtime";
export { type default as Patcher } from "./extension-support/patcher";
export { type default as BlockUtility } from "./engine/block-utility";
export { type default as Target } from "./engine/target";
export { type default as RenderedTarget } from "./sprites/rendered-target";
export { type default as Sprite } from "./sprites/sprite";
