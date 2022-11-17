const fs = require("fs");
const pkgJson = require("./package.json");
const path = require("path");

const [mode] = process.argv.slice(2);

const main = () => {
  if (mode === "dev") {
    pkgJson.main = "./out/extension.js";
  } else if (mode === "prod") {
    pkgJson.main = "./bundle/main.js";
  }
  fs.writeFileSync(
    path.resolve(__dirname, "./package.json"),
    JSON.stringify(pkgJson, undefined, 2)
  );
};

main();
