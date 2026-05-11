const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname,'..');
const libDir = path.join(root,'lib');
const cjsDir = path.join(libDir,'cjs');
const esmDir = path.join(libDir,'esm');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir,{recursive: true});
  }
};

const writePackageJson = (dir,type) => {
  ensureDir(dir);
  const pkgPath = path.join(dir,'package.json');
  const data = {
    type,
  };
  fs.writeFileSync(pkgPath,JSON.stringify(data,null,2));
};

writePackageJson(cjsDir,'commonjs');
writePackageJson(esmDir,'module');
