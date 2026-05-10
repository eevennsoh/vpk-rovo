const Module = require("node:module");
const path = require("node:path");

function loadCjsModuleFromText(sourceText, sourcefile = "esbuild-test-harness.cjs") {
	const filename = path.isAbsolute(sourcefile)
		? sourcefile
		: path.join(process.cwd(), sourcefile);
	const compiledModule = new Module(filename, module);
	compiledModule.filename = filename;
	compiledModule.paths = Module._nodeModulePaths(path.dirname(filename));
	compiledModule._compile(sourceText, filename);
	return compiledModule.exports;
}

module.exports = { loadCjsModuleFromText };
