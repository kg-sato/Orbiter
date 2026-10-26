/* Paired local browser adapter. The database and timer belong to Orbit's native process. */
(() => {
  if (location.origin !== "http://127.0.0.1:18743") return;
  let csrf = "",
    current = null,
    events = null,
    draftGeneration = 0;
  const request = async (path, payload) => {
    const r = await fetch(
      `/api/${path}`,
      payload === undefined
        ? {}
        : {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Orbit-CSRF": csrf,
            },
            body: JSON.stringify(payload),
          },
    );
    const value = await r.json();
    if (!r.ok)
      throw Object.assign(
        new Error(value.error || "Desktop connection unavailable"),
        { status: r.status },
      );
    return value;
  };
  const publish = v => { window.OrbiterNativeState = v; window.dispatchEvent(new CustomEvent("orbiter-native-state", {detail:v})); return v; };
  const ready = (async () => {
    const token = new URLSearchParams(location.hash.slice(1)).get("pair");
    if (token) {
      history.replaceState(null, "", location.pathname);
      const paired = await request("pair", { token });
      csrf = paired.csrf;
    }
    current = await request("state");
    csrf = current.csrf;
    return publish(current);
  })();
  window.OrbitDesktop = {
    ready,
    actionResult: async (action,args={}) => { const value=await request("action",{action,args}); if(value.editRevision===current.editRevision)current=value; publish(value); return value; },
    save: async (workspace, importing = false) => {
      await ready;
      const revision = current.editRevision;
      const previousDraft = sessionStorage.getItem("orbit.unsaved-draft");
      const generation = draftGeneration;
      try {
        const value = await request("workspace", {
          workspace,
          revision,
          import: importing,
        });
        current = value;
        publish(value);
        // A later rejected save owns its recovery draft, even if its bytes match.
        if (generation === draftGeneration &&
            sessionStorage.getItem("orbit.unsaved-draft") === previousDraft)
          sessionStorage.removeItem("orbit.unsaved-draft");
        return value.workspace;
      } catch (error) {
        // This origin is private to the paired desktop website. Never discard a rejected draft.
        sessionStorage.setItem(
          "orbit.unsaved-draft",
          JSON.stringify(workspace),
        );
        draftGeneration++;
        throw error;
      }
    },
    action: async (action, args = {}) => {
      return (await window.OrbitDesktop.actionResult(action,args)).workspace;
    },
    subscribe(callback) {
      events?.close();
      events = new EventSource("/api/events");
      let pending = false,
        repeat = false;
      events.onmessage = async () => {
        if (pending) {
          repeat = true;
          return;
        }
        pending = true;
        try {
          do {
            repeat = false;
            const value = await request("state");
            publish(value);
            if (
              value.revision > current.revision &&
              (await callback(value.workspace)) !== false
            ) {
              current = value;
            }
          } while (repeat);
        } catch (e) {
          console.error("Orbit connection", e);
        } finally {
          pending = false;
        }
      };
      events.onerror = () =>
        window.dispatchEvent(new CustomEvent("orbit-connection-lost"));
      events.onopen = events.onmessage;
    },
    reload: async () => {
      current = await request("state");
      publish(current);
      return current.workspace;
    },
    draft: () => sessionStorage.getItem("orbit.unsaved-draft"),
  };
})();
