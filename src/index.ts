// Scratch-parser's unpack.js (a CommonJS dependency inside node_modules)
// references the global `Buffer` object directly. In browser environments
// Buffer is not defined, so expose a Buffer polyfill on the global object.
import { Buffer as BufferPolyfill } from "buffer";

const global: any = globalThis;
if (!globalThis.Buffer) {
  globalThis.Buffer = BufferPolyfill;
}

globalThis.global = global;

import VirtualMachine from "./virtual-machine";
export default VirtualMachine;

export { default as ExtensionManager } from "./extension-support/extension-manager";
export { default as Runtime } from "./engine/runtime";
export { default as Patcher } from "./extension-support/patcher";
export { default as BlockUtility } from "./engine/block-utility";
export { default as Target } from "./engine/target";
export { default as RenderedTarget } from "./sprites/rendered-target";
export { default as Sprite } from "./sprites/sprite";
