/* Promise-based iPhone contract. No storage, automatic requests or health import. */
(() => {
  'use strict';
  const pending = new Map();
  const epoch = Math.random().toString(36).slice(2);
  let sequence = 0, capability = null, healthCapability = null, healthRequested = false, healthGeneration = 0, lifeGeneration = 0;
  const failure = (code, message) => Object.assign(new Error(message), {code});
  function request(operation, fields = {}, action = 'lifeStore') {
    const bridge = window.webkit?.messageHandlers?.scheduleFiles;
    if (!bridge) return Promise.reject(failure('unavailable', 'Native life storage is unavailable.'));
    if (pending.size >= 16) return Promise.reject(failure('busy', 'Too many pending storage requests.'));
    const requestId = `life-${epoch}-${++sequence}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(requestId);
        reject(failure('timeout', 'Native storage did not respond. No retry was submitted automatically.'));
      }, 10000);
      pending.set(requestId, {resolve, reject, timeout, action});
      try { bridge.postMessage({action, requestId, operation, ...fields}); }
      catch (_) {
        clearTimeout(timeout); pending.delete(requestId);
        reject(failure('unavailable', 'Native storage could not be reached.'));
      }
    });
  }
  function receive(action, event) {
    const response = event.detail, task = pending.get(response?.requestId);
    if (!task || task.action !== action) return;
    pending.delete(response.requestId); clearTimeout(task.timeout);
    if (response.ok === true) task.resolve(response.value);
    else task.reject(failure(typeof response.error?.code === 'string' ? response.error.code : 'error',
      typeof response.error?.message === 'string' ? response.error.message : 'Native storage request failed.'));
  }
  window.addEventListener('nativeLifeStoreResult', event => receive('lifeStore', event));
  window.addEventListener('nativeHealthResult', event => receive('health', event));
  window.addEventListener('pagehide', () => {
    capability = null; healthCapability = null; healthRequested = false; healthGeneration++; lifeGeneration++;
    for (const task of pending.values()) {
      clearTimeout(task.timeout); task.reject(failure('cancelled', 'The page left before storage completed.'));
    }
    pending.clear();
  });
  function options(value, write = false) {
    if (!value || value.owner !== 'device') throw failure('invalidOwner', 'A native-owned device scope is required.');
    if (write && (!Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0))
      throw failure('invalid', 'A valid expected revision is required.');
    if (!(write ? capability?.write : capability?.read))
      throw failure('unavailable', capability?.reason || 'Protected iPhone storage has not been enabled.');
  }
  window.OrbiterNativeLifeStore = Object.freeze({
    async capabilities() {
      const value = await request('capabilities');
      if (!value || value.contractVersion !== 1 || value.owner !== 'device' ||
          typeof value.read !== 'boolean' || typeof value.write !== 'boolean')
        throw failure('invalid', 'Unsupported native storage capability response.');
      capability = Object.freeze({...value});
      return capability;
    },
    async requestAccess(value) {
      if(value?.consent!==true)throw failure('optInRequired','Confirm protected journal access first.');
      if(!capability?.read||!capability?.write)throw failure('unavailable',capability?.reason||'Protected journal unavailable.');
      const generation=lifeGeneration,result=await request('requestAccess',{consent:true});
      if(generation!==lifeGeneration)throw failure('cancelled','Journal access ended.');
      return result;
    },
    async revoke() {
      lifeGeneration++; healthGeneration++; healthRequested=false; capability=null;
      return request('revoke');
    },
    async read(value) { options(value); return request('read', {owner:value.owner}); },
    async write(value) {
      options(value, true);
      if (!value.data || Array.isArray(value.data) || value.data.schemaVersion !== 1)
        throw failure('invalid', 'A version 1 journal object is required.');
      let json;
      try { json = JSON.stringify(value.data); }
      catch (_) { throw failure('invalid', 'Journal must be JSON data.'); }
      if (new TextEncoder().encode(json).byteLength > 5 * 1024 * 1024)
        throw failure('invalid', 'Journal exceeds the 5 MiB storage limit.');
      return request('write', {owner:value.owner, expectedRevision:value.expectedRevision, json});
    },
    async clear(value) {
      options(value, true);
      return request('clear', {owner:value.owner, expectedRevision:value.expectedRevision});
    }
  });
  window.OrbiterNativeHealth = Object.freeze({
    async capabilities() {
      const value = await request('capabilities', {}, 'health');
      if (!value || value.contractVersion !== 1 || value.owner !== 'device' || typeof value.available !== 'boolean')
        throw failure('invalid', 'Unsupported native Health capability response.');
      healthCapability = Object.freeze({...value}); return healthCapability;
    },
    async requestAccess(value) {
      if (value?.consent !== true) throw failure('optInRequired', 'Confirm the read-only Health connection first.');
      if (!healthCapability?.available) throw failure('unavailable', healthCapability?.reason || 'Native Health integration is unavailable.');
      const generation = healthGeneration;
      const result = await request('requestAccess', {consent:true}, 'health');
      if (generation !== healthGeneration) throw failure('cancelled', 'The Health connection was disconnected.');
      // Completed request is NOT proof of read authorization; Apple conceals it.
      healthRequested = result?.status === 'requestCompleted'; return result;
    },
    async read(value = {}) {
      const days = value.days ?? 7;
      if (!Number.isSafeInteger(days) || days < 1 || days > 31) throw failure('invalid', 'Choose one to 31 days.');
      if (!healthCapability?.available) throw failure('unavailable', 'Native Health integration is unavailable.');
      if (!healthRequested) throw failure('optInRequired', 'Request Health access first.');
      const generation = healthGeneration;
      const result = await request('read', {days}, 'health');
      if (generation !== healthGeneration) throw failure('cancelled', 'The Health connection was disconnected.');
      return result;
    },
    async disconnect() {
      healthRequested = false; healthGeneration++;
      return request('disconnect', {}, 'health');
    }
  });
})();
