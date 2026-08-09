import type ArgumentType from "./argument-type";
import type BlockType from "./block-type";

export interface ExtensionMetadata {
  id: string;
  name?: string;
  blockIconURI?: string;
  menuIconURI?: string;
  docsURI?: string;
  blocks: Array<ExtensionBlockMetadata | string>;
  menus?: Record<string, MenuInfo>;
  warningTipText?: any;
  targetTypes?: string[];
}

export interface ExtensionBlockMetadata {
  xml: string;
  callFunc?: () => void;
  isDynamic: any;
  opcode: string;
  func?: string | Function;
  blockType: (typeof BlockType)[string];
  text: string;
  tooltip?: string;
  hideFromPalette?: Boolean;
  isTerminal?: Boolean;
  disableMonitor?: Boolean;
  // reporterScope?: ReporterScope;
  reporterScope?: any;
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

export interface MenuInfo {
  // This flag makes a "droppable" menu: the menu will allow dropping a reporter in for the input.
  acceptReporters?: boolean;

  // The 'item' property may be an array or function name as in previous menu examples.
  // static menu use array
  // dynamic menu use function name string
  items: ExtensionMenuItems | ((...args:any)=>any[]);
}
