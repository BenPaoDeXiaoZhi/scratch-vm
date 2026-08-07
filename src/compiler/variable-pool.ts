class VariablePool {
    /**
     * @type {string}
     */
    prefix: string;

    /**
     * @type {number}
     * @private
     */
    count: number;

    /**
     * @param {string} prefix The prefix at the start of the variable name.
     */
    constructor (prefix: string) {
        if (prefix.trim().length === 0) {
            throw new Error('prefix cannot be empty');
        }
        this.prefix = prefix;
        this.count = 0;
    }

    next () {
        return `${this.prefix}${this.count++}`;
    }
}

export default VariablePool;