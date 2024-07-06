import ts from "typescript";

/**
 * Transpiles the TypeScript code to JavaScript.
 * @param {string} code The TypeScript code.
 * @param {boolean} noExceptions Whether to throw exceptions on failed transpilation or not.
 * @returns {string} The transpiled JavaScript code.
 * @throws {Error} If `noExceptions` is `false` and the transpilation fails.
 */
const transpileTypeSctiptToJs = (code: string | undefined | null, noExceptions: boolean) => {
    if (code === undefined || code === null) {
        return "";
    }

    // See sample at: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

    try {
        const transpile = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2023,
                module: ts.ModuleKind.ESNext,
                noEmit: noExceptions,
            },
        });

        return transpile.outputText;
    } catch (error) {
        if (noExceptions) {
            return "";
        } else {
            throw error;
        }
    }
};

export { transpileTypeSctiptToJs };
