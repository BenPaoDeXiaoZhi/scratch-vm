import type ArgumentType from "./argument-type";
import type BlockType from "./block-type";

export interface ExtensionMetadata {
  id: string;
  name?: string;
  blockIconURI?: string;
  menuIconURI?: string;
  docsURI?: string;
  blocks: Array<ExtensionBlockMetadata | string>;
  menus?: Record<string, ExtensionMenuMetadata>;
}

export interface ExtensionBlockMetadata {
  opcode: string;
  func?: string;
  blockType: typeof BlockType;
  text: string;
  tooltip?: string;
  hideFromPalette?: Boolean;
  isTerminal?: Boolean;
  disableMonitor?: Boolean;
  reporterScope?: ReporterScope;
  isEdgeActivated?: Boolean;
  shouldRestartExistingThreads?: Boolean;
  branchCount?: number;
  arguments?: Record<string, ExtensionArgumentMetadata>;
}

export interface ExtensionArgumentMetadata {
  type: typeof ArgumentType;
  defaultValue?: any;
  menu?: string;
}

export type ExtensionMenuMetadata = ExtensionDynamicMenu | ExtensionMenuItems;

export type ExtensionDynamicMenu = string;
/**
 * @see {ExtensionMenuItems} - the type of data expected to be returned by the specified function.
 */

export type ExtensionMenuItems = Array<
  ExtensionMenuItemSimple | ExtensionMenuItemComplex
>;

export type ExtensionMenuItemSimple = string;

export interface ExtensionMenuItemComplex {
  value: any;
  text: string;
}
