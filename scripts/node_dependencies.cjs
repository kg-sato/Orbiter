/* Explicitly share an existing dependency installation between local worktrees. */
const path=require('node:path'),{createRequire}=require('node:module');
const directory=process.env.ORBITER_NODE_MODULES;
const nodePaths=directory?[path.resolve(directory)]:[];
module.exports={load:directory?createRequire(path.join(nodePaths[0],'package.json')):require,nodePaths};
