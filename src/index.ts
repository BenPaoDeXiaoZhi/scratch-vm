// Scratch-parser's unpack.js (a CommonJS dependency inside node_modules)
// references the global `Buffer` object directly. In browser environments
// Buffer is not defined, so expose a Buffer polyfill on the global object.
import { Buffer as BufferPolyfill } from "buffer";

const global: any =
  typeof globalThis !== "undefined" ? globalThis : (window as any);
if (!global.Buffer) {
  global.Buffer = BufferPolyfill;
}

globalThis.global = global

import VirtualMachine from './virtual-machine';

export default VirtualMachine;