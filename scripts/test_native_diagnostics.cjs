/* Native diagnostic bursts stay bounded without replacing the public array. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function main() {
  const windowEvents = new Map(), documentEvents = new Map();
  const window = {
    addEventListener: (name, callback) => windowEvents.set(name, callback),
    dispatchEvent() {},
    __TAURI__: {
      core: { invoke: async () => ({ revision: 1, editRevision: 1, workspace: {} }) },
      event: { listen() {} },
    },
  };
  const context = {
    window,
    document: { addEventListener: (name, callback) => documentEvents.set(name, callback) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../desktop/ui/native-adapter.js'), 'utf8'), context);
  await window.OrbitDesktop.ready;
  const history = window.OrbiterNativeErrors;
  const expected = [];
  for (let index = 0; index < 350; index++) {
    const message = `failure-${index}:` + 'x'.repeat(400);
    const isCsp = index % 2 === 0;
    if (isCsp) {
      documentEvents.get('securitypolicyviolation')({ violatedDirective: 'script-src', blockedURI: message });
    } else {
      windowEvents.get('error')({ message });
    }
    expected.push((isCsp ? 'CSP script-src ' + message : message).slice(0, 250));
    assert.equal(window.OrbiterNativeErrors, history, 'public diagnostic array identity changes');
    assert.equal(history.length, Math.min(index + 1, 100), 'diagnostic history exceeds its bound');
  }
  assert.deepEqual(Array.from(history), expected.slice(-100), 'latest mixed diagnostics retain their order');
  assert.ok(history.every(message => message.length === 250), 'both error types must truncate long messages');
  windowEvents.get('error')({ message: 'short error' });
  documentEvents.get('securitypolicyviolation')({ violatedDirective: 'img-src', blockedURI: 'blocked.png' });
  assert.deepEqual(Array.from(history.slice(-2)), ['short error', 'CSP img-src blocked.png']);
  assert.equal(history.length, 100);
  console.log('PASS: 350 mixed diagnostics retain the latest 100 entries, ordering, truncation, and array identity.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
