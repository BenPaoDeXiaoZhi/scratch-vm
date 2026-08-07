import { IRGenerator  } from './irgen';
import JSGenerator from './jsgen';

/**
 * @param {any} thread
 * @returns {any}
 */
const compile = (thread: any): any => {
    const irGenerator = new IRGenerator(thread);
    const ir = irGenerator.generate();

    const procedures: Record<string, any> = {};
    const target = thread.target;

    /**
     * @param {any} script
     * @returns {any}
     */
    const compileScript = (script: any): any => {
        if (script.cachedCompileResult) {
            return script.cachedCompileResult;
        }

        const compiler = new JSGenerator(script, ir, target);
        const result = compiler.compile();
        script.cachedCompileResult = result;
        return result;
    };

    const entry = compileScript(ir.entry);

    for (const procedureVariant of Object.keys(ir.procedures)) {
        const procedureData = ir.procedures[procedureVariant];
        const procedureTree = compileScript(procedureData);
        procedures[procedureVariant] = procedureTree;
    }

    return {
        startingFunction: entry,
        procedures,
        executableHat: ir.entry?.executableHat
    };
};

export default compile;