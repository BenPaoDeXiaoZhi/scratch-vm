import EventEmitter from "events";
import AssetUtil from "../util/tw-asset-util";
import StringUtil from "../util/string-util";
import log from "../util/log";

interface InternalFont {
  system: boolean;
  family: string;
  fallback: string;
  asset?: any;
}

class FontManager extends EventEmitter {
  runtime: any;
  fonts: InternalFont[];

  /**
   * @param {Runtime} runtime
   */
  constructor(runtime: any) {
    super();
    this.runtime = runtime;
    /** @type {Array<InternalFont>} */
    this.fonts = [];
  }

  /**
   * @param {string} family An unknown font family
   * @returns {boolean} true if the family is valid
   */
  isValidFamily(family: string): boolean {
    return /^[-\w ]+$/.test(family);
  }

  /**
   * @param {string} family
   * @returns {boolean}
   */
  hasFont(family: string): boolean {
    return !!this.fonts.find((i) => i.family === family);
  }

  /**
   * @param {string} family
   * @returns {boolean}
   */
  getSafeName(family) {
    family = family.replace(/[^-\w ]/g, "");
    return StringUtil.unusedName(
      family,
      this.fonts.map((i) => i.family),
    );
  }

  changed(): void {
    this.emit("change");
  }

  /**
   * @param {string} family
   * @param {string} fallback
   */
  addSystemFont(family: string, fallback: string): void {
    if (!this.isValidFamily(family)) {
      throw new Error("Invalid family");
    }
    this.fonts.push({
      system: true,
      family,
      fallback,
    });
    this.changed();
  }

  /**
   * @param {string} family
   * @param {string} fallback
   * @param {Asset} asset scratch-storage asset
   */
  addCustomFont(family: string, fallback: string, asset: any): void {
    if (!this.isValidFamily(family)) {
      throw new Error("Invalid family");
    }

    this.fonts.push({
      system: false,
      family,
      fallback,
      asset,
    });

    this.updateRenderer();
    this.changed();
  }

  /**
   * @returns {Array<{system: boolean; name: string; family: string; data: Uint8Array | null; format: string | null}>}
   */
  getFonts(): any[] {
    return this.fonts.map((font) => ({
      system: font.system,
      name: font.family,
      family: `"${font.family}", ${font.fallback}`,
      data: font.asset ? font.asset.data : null,
      format: font.asset ? font.asset.dataFormat : null,
    }));
  }

  /**
   * @param {number} index Corresponds to index from getFonts()
   */
  deleteFont(index: number): void {
    const [removed] = this.fonts.splice(index, 1);
    if (!removed.system) {
      this.updateRenderer();
    }
    this.changed();
  }

  clear(): void {
    const hadNonSystemFont = this.fonts.some((i) => !i.system);
    this.fonts = [];
    if (hadNonSystemFont) {
      this.updateRenderer();
    }
    this.changed();
  }

  updateRenderer(): void {
    if (!this.runtime.renderer || !this.runtime.renderer.setCustomFonts) {
      return;
    }

    const fontfaces = {};
    for (const font of this.fonts) {
      if (!font.system) {
        const uri = font.asset.encodeDataURI();
        const fontface = `@font-face { font-family: "${font.family}"; src: url("${uri}"); }`;
        const family = `"${font.family}", ${font.fallback}`;
        fontfaces[family] = fontface;
      }
    }
    this.runtime.renderer.setCustomFonts(fontfaces);
  }

  /**
   * Get data to save in project.json and sb3 files.
   */
  serializeJSON(): any {
    if (this.fonts.length === 0) {
      return null;
    }

    return this.fonts.map((font) => {
      const serialized: any = {
        system: font.system,
        family: font.family,
        fallback: font.fallback,
      };

      if (!font.system) {
        const asset = font.asset;
        serialized.md5ext = `${asset.assetId}.${asset.dataFormat}`;
      }

      return serialized;
    });
  }

  /**
   * @returns {Asset[]} list of scratch-storage assets
   */
  serializeAssets(): any[] {
    return this.fonts.filter((i) => !i.system).map((i) => i.asset);
  }

  /**
   * @param {unknown} json
   * @param {JSZip} [zip]
   * @param {boolean} [keepExisting]
   * @returns {Promise<void>}
   */
  async deserialize(
    json: any,
    zip?: any,
    keepExisting?: boolean,
  ): Promise<void> {
    if (!keepExisting) {
      this.clear();
    }

    if (!Array.isArray(json)) {
      return;
    }

    for (const font of json) {
      if (!font || typeof font !== "object") {
        continue;
      }

      try {
        const system = font.system;
        const family = font.family;
        const fallback = font.fallback;
        if (
          typeof system !== "boolean" ||
          typeof family !== "string" ||
          typeof fallback !== "string" ||
          this.hasFont(family)
        ) {
          continue;
        }

        if (system) {
          this.addSystemFont(family, fallback);
        } else {
          const md5ext = font.md5ext;
          if (typeof md5ext !== "string") {
            continue;
          }

          const asset = await AssetUtil.getByMd5ext(
            this.runtime,
            zip,
            this.runtime.storage.AssetType.Font,
            md5ext,
          );
          this.addCustomFont(family, fallback, asset);
        }
      } catch (e) {
        log.error("could not add font", e);
      }
    }
  }
}

export default FontManager;
