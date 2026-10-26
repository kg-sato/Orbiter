/* Rigid classification uses actual GLB weights; repeated clones share geometry. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/mascot/avatar.js'),'utf8');
const start=source.indexOf('const rigidJoints='),end=source.indexOf('// Decode the bundled asset',start);
assert(start>=0&&end>start,'Production classification helper exists');
const context=vm.createContext({});vm.runInContext(source.slice(start,end),context);
const classify=context.rigidJoint;
let reads=0;
function attribute(rows){return{version:0,count:rows.length,getX(i){reads++;return rows[i][0];},getY(i){reads++;return rows[i][1];},getZ(i){reads++;return rows[i][2];},getW(i){reads++;return rows[i][3];}};}
function geometry(indices,weights){return{attributes:{skinIndex:attribute(indices),skinWeight:attribute(weights)}};}
const rigid=geometry([[0,0,0,0],[0,0,0,0]],[[1,0,0,0],[1,0,0,0]]);
assert.equal(classify(rigid),0,'Bone zero must not be treated as false');
const firstReads=reads;assert.equal(classify(rigid),0);assert.equal(reads,firstReads,'Shared clone geometry skips all repeated reads');
const differentJoints=geometry([[0,0,0,0],[1,0,0,0]],[[1,0,0,0],[1,0,0,0]]);
assert.equal(classify(differentJoints),null,'Different rigid joints keep GPU skinning');
const blended=geometry([[0,1,0,0]],[[.5,.5,0,0]]);assert.equal(classify(blended),null);
const blendedReads=reads;assert.equal(classify(blended),null);assert.equal(reads,blendedReads,'Blended result is cached too');
const threshold=geometry([[3,0,0,0]],[[.999,.001,.001,.001]]);assert.equal(classify(threshold),3,'Existing threshold semantics preserved');
threshold.attributes.skinWeight=attribute([[.998,.002,0,0]]);assert.equal(classify(threshold),null,'Replaced attributes invalidate');
threshold.attributes.skinWeight=attribute([[1,0,0,0]]);assert.equal(classify(threshold),3);
threshold.attributes.skinWeight.getX=()=>{reads++;return .5;};threshold.attributes.skinWeight.version++;
assert.equal(classify(threshold),null,'Changed buffer version invalidates');
assert.equal(classify({attributes:{}}),null,'Missing attributes are not rigid');
assert.equal(classify(geometry([],[])),null,'Empty geometry is not rigid');
// Decode the shipped GLB directly, keeping this regression dependency-free.
const bytes=fs.readFileSync(path.join(root,'src/mascot/assets/kitten.glb'));
assert.equal(bytes.toString('ascii',0,4),'glTF');
const jsonLength=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+jsonLength));
const binaryStart=20+jsonLength+8;
function accessor(id){
 const a=doc.accessors[id],view=doc.bufferViews[a.bufferView],components={VEC4:4}[a.type];
 assert.equal(components,4);assert(!a.sparse,'Fixture expects dense skin data');
 const types={5121:['readUInt8',1],5123:['readUInt16LE',2],5126:['readFloatLE',4]},[method,size]=types[a.componentType];
 const offset=binaryStart+(view.byteOffset||0)+(a.byteOffset||0),stride=view.byteStride||components*size;
 const rows=Array.from({length:a.count},(_,i)=>Array.from({length:4},(_,c)=>bytes[method](offset+i*stride+c*size)));
 return attribute(rows);
}
const geometries=doc.meshes.flatMap(mesh=>mesh.primitives.filter(p=>p.attributes.JOINTS_0!==undefined).map(primitive=>({attributes:{skinIndex:accessor(primitive.attributes.JOINTS_0),skinWeight:accessor(primitive.attributes.WEIGHTS_0)}})));
reads=0;const results=geometries.map(classify),initialReads=reads;
assert(results.every(j=>Number.isInteger(j)&&j>=0),'All current authored pieces are rigid');
for(let clone=0;clone<50;clone++)assert.deepEqual(geometries.map(classify),results);
assert.equal(reads,initialReads,'Fifty subsequent clones add zero skin attribute reads');
const vertices=geometries.reduce((sum,g)=>sum+g.attributes.skinIndex.count,0);
assert.equal(initialReads,vertices*5,'First classification reads four weights and one index per vertex');
console.log(`PASS: ${geometries.length} shipped geometries, ${vertices} vertices; first classification ${initialReads} attribute reads, 50 repeated clones 0 additional reads; rigid/blended/multi-joint/cache invalidation preserved.`);
