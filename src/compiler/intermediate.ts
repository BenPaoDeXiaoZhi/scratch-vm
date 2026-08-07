/**
 * @fileoverview Common intermediates shared amongst parts of the compiler.
 */

/**
 * An IntermediateScript describes a single script.
 * Scripts do not necessarily have hats.
 */
class IntermediateScript {
    /**
     * The ID of the top block of this script.
     * @type {string|null}
     */
    topBlockId: string | null;

    /**
     * List of nodes that make up this script.
     * @type {Array|null}
     */
    stack: any[] | null;

    /**
     * Whether this script is a procedure.
     * @type {boolean}
     */
    isProcedure: boolean;

    /**
     * This procedure's variant, if any.
     * @type {string}
     */
    procedureVariant: string;

    /**
     * This procedure's code, if any.
     * @type {string}
     */
    procedureCode: string;

    /**
     * List of names of arguments accepted by this function, if it is a procedure.
     * @type {string[]}
     */
    arguments: string[];

    /**
     * Whether this script should be run in warp mode.
     * @type {boolean}
     */
    isWarp: boolean;

    /**
     * Whether this script can `yield`
     * If false, this script will be compiled as a regular JavaScript function (function)
     * If true, this script will be compiled as a generator function (function*)
     * @type {boolean}
     */
    yields: boolean;

    /**
     * Whether this script should use the "warp timer"
     * @type {boolean}
     */
    warpTimer: boolean;

    /**
     * List of procedure IDs that this script needs.
     * @readonly
     */
    dependedProcedures: string[];

    /**
     * Cached result of compiling this script.
     * @type {Function|null}
     */
    cachedCompileResult: Function | null;

    /**
     * global procedure target
     * @type {Target|null}
     */
    target: any | null;

    /**
     * Whether the top block of this script is an executable hat.
     * @type {boolean}
     */
    executableHat: boolean;

    constructor () {
        this.topBlockId = null;
        this.stack = null;
        this.isProcedure = false;
        this.procedureVariant = '';
        this.procedureCode = '';
        this.arguments = [];
        this.isWarp = false;
        this.yields = true;
        this.warpTimer = false;
        this.dependedProcedures = [];
        this.cachedCompileResult = null;
        this.target = null;
        this.executableHat = false;
    }
}

/**
 * An IntermediateRepresentation contains scripts.
 */
class IntermediateRepresentation {
    /**
     * The entry point of this IR.
     * @type {IntermediateScript|null}
     */
    entry: IntermediateScript | null;

    /**
     * Maps procedure variants to their intermediate script.
     * @type {Object.<string, IntermediateScript>}
     */
    procedures: Record<string, IntermediateScript>;

    constructor () {
        this.entry = null;
        this.procedures = {};
    }
}

export { IntermediateScript, IntermediateRepresentation };
