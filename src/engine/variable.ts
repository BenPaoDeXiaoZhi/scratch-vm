import uid from "../util/uid";
import xmlEscape from "../util/xml-escape";
import "../util/global-this-shim";

/* eslint-disable no-undef */
/**
 * @fileoverview
 * Object representing a Scratch variable.
 */
// Resolve the issue of "globalThis is not defined" error in a low version client.

class Variable {
  id: string;
  name: string;
  type: string;
  isCloud: boolean;
  targetId: string;
  value: any;
  /**
   * @param {string} id Id of the variable.
   * @param {string} name Name of the variable.
   * @param {string} type Type of the variable, one of '' or 'list'
   * @param {boolean} isCloud Whether the variable is stored in the cloud.
   * @constructor
   */
  constructor(
    id: string | null,
    name: string,
    type: string,
    isCloud: boolean,
    targetId: string,
  ) {
    this.id = id || uid();
    this.name = name;
    this.type = type;
    this.isCloud = isCloud;
    this.targetId = targetId;

    switch (this.type) {
      case Variable.SCALAR_TYPE:
        this.value = 0;
        break;
      case Variable.LIST_TYPE:
        this.value = [];
        break;
      case Variable.BROADCAST_MESSAGE_TYPE:
        this.value = this.name;
        break;
      default:
        throw new Error(`Invalid variable type: ${this.type}`);
    }
    if (globalThis.$monitoringVariable) {
      // Broadcast the event after creating it to avoid the target
      // from being unable to retrieve the corresponding variable instance.
      setTimeout(() => {
        globalThis.dispatchEvent(
          new CustomEvent("createVariable", { detail: { ...this } }),
        );
      }, 1);
    }
  }

  toXML(isLocal: boolean) {
    isLocal = isLocal === true;
    return `<variable type="${this.type}" id="${this.id}" islocal="${
      isLocal
    }" iscloud="${this.isCloud}">${xmlEscape(this.name)}</variable>`;
  }

  /**
   * Type representation for scalar variables.
   * This is currently represented as ''
   * for compatibility with blockly.
   * @const {string}
   */
  static get SCALAR_TYPE() {
    return ""; // used by compiler
  }

  /**
   * Type representation for list variables.
   * @const {string}
   */
  static get LIST_TYPE() {
    return "list"; // used by compiler
  }

  /**
   * Type representation for list variables.
   * @const {string}
   */
  static get BROADCAST_MESSAGE_TYPE() {
    return "broadcast_msg";
  }
}

export default Variable;
