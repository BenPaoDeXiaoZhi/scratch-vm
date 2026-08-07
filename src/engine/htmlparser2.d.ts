declare module "htmlparser2" {
  export interface Node {
    name?: string;
    attribs?: Record<string, string>;
    children?: Node[];
    data?: string;
  }

  export interface Document extends Node {
    children: Node[];
  }

  export interface Options {
    decodeEntities?: boolean;
  }

  export function parseDocument(html: string, options?: Options): Document;
}
