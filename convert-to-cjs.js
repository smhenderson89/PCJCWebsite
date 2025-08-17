/* One time script to convert evertyhing from ejs modules to common js modules */

const fs = require("fs");
const path = require("path");

// 👇 change this if your source lives elsewhere
const rootDir = ".";  

function convertFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");

  // import defaultExport from "module"
  code = code.replace(
    /import\s+([a-zA-Z0-9_$]+)\s+from\s+["']([^"']+)["'];?/g,
    'const $1 = require("$2");'
  );

  // import { named } from "module"
  code = code.replace(
    /import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?/g,
    'const { $1 } = require("$2");'
  );

  // import * as alias from "module"
  code = code.replace(
    /import\s+\*\s+as\s+([a-zA-Z0-9_$]+)\s+from\s+["']([^"']+)["'];?/g,
    'const $1 = require("$2");'
  );

  // export default ...
  code = code.replace(/export\s+default\s+/g, "module.exports = ");

  // export { a, b }
  code = code.replace(/export\s+\{([^}]+)\};?/g, "module.exports = { $1 };");

  // export const foo = ... / export function bar() / export class Baz
  code = code.replace(
    /export\s+(const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/g,
    "$1 $2;\nmodule.exports.$2 = $2"
  );

  fs.writeFileSync(filePath, code, "utf8");
  console.log(`✅ Converted: ${filePath}`);
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // 🚫 skip these folders
      if (["node_modules", ".git", "dist", "build", "convert-to-cjs"].includes(file)) return;
      walkDir(fullPath);
    } else if (file.endsWith(".js")) {
      // 🚫 skip the converter script itself
      if (file === "convert-to-cjs.js") return;
      convertFile(fullPath);
    }
  });
}

walkDir(rootDir);
console.log("🎉 Conversion to CommonJS complete!");
