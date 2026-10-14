/* Account sync is explicit: local data is never uploaded just because somebody signs in. */
(() => {
  "use strict";
  const bridge = window.SchedulerAccountBridge;
  const entry = document.getElementById("open-account");
  if (!entry || !bridge) return;
  const dialog = document.createElement("dialog");
  dialog.id = "account-dialog";
  dialog.setAttribute("aria-labelledby", "account-title");
  // Static markup only; all account names and messages below use textContent.
  dialog.innerHTML = `
    <h2 id="account-title">Your space, connected.</h2>
    <p id="account-intro">Sign in to save a copy of your workspace to your account.</p>
    <form id="account-auth">
      <label for="account-name">Username</label>
      <input id="account-name" autocomplete="username" minlength="3" maxlength="40" pattern="[a-zA-Z0-9_.-]+" required>
      <label for="account-password">Passphrase</label>
      <input id="account-password" type="password" autocomplete="current-password" minlength="15" maxlength="128" required aria-describedby="account-password-help">
      <p id="account-password-help">Use 15 or more characters. A few memorable words work well.</p>
      <div class="account-actions"><button type="submit" value="login">Sign in</button><button type="submit" value="register">Create account</button></div>
    </form>
    <section id="account-workspace" hidden>
      <p id="account-identity"></p>
      <p>Choose which copy to keep. Saving replaces the account copy; loading replaces this device's workspace. Each action requires your selection below.</p>
      <label><input type="checkbox" id="account-confirm"> I am ready to replace the selected copy.</label>
      <div class="account-actions">
        <button type="button" id="account-upload">Save device to account</button>
        <button type="button" id="account-download">Load account to device</button>
        <button type="button" id="account-logout">Sign out</button>
      </div>
      <p>Signing out ends the account session. Your device's local schedule stays on this browser.</p>
    </section>
    <p id="account-status" role="status" aria-live="polite"></p>
    <div class="account-actions"><button type="button" id="account-backup">Download pre-sync backup</button><button type="button" id="account-close">Done</button></div>`;
  document.body.append(dialog);
  const $ = (id) => document.getElementById(id);
  let account = null;
  let revision = null;
  let busy = false;
  const status = (text) => {
    $("account-status").textContent = text;
  };
  function paint() {
    $("account-auth").hidden = !!account;
    $("account-workspace").hidden = !account;
    $("account-identity").textContent = account
      ? `Signed in as ${account.username}`
      : "";
    $("account-backup").hidden = !bridge.backup();
  }
  async function api(path, body) {
    const response = await fetch("/api/" + path, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(account ? { "X-CSRF-Token": account.csrf } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json().catch(() => ({
      error: "Open Scheduler through its account server to use sync.",
    }));
    if (!response.ok) {
      if (response.status === 401) {
        account = null;
        revision = null;
        paint();
      }
      throw new Error(result.error || "Account request failed.");
    }
    return result;
  }
  async function run(action) {
    if (busy) return;
    busy = true;
    dialog.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
    });
    try {
      await action();
    } catch (error) {
      status(
        error.name === "TimeoutError"
          ? "The server took too long. Your local copy is unchanged; reconnect before retrying."
          : error.message,
      );
    } finally {
      busy = false;
      dialog.querySelectorAll("button").forEach((button) => {
        button.disabled = false;
      });
      $("account-confirm").checked = false;
      paint();
    }
  }
  async function connectAccount() {
    const session = await api("session");
    account = session.username ? session : null;
    revision = null;
    if (account) {
      const remote = await api("workspace");
      revision = remote.revision;
      status(
        remote.data
          ? "Account workspace found. Choose save or load."
          : "Your account is ready for its first workspace.",
      );
    } else status("Sign in or create a local account.");
    paint();
  }
  entry.addEventListener("click", () => {
    document.getElementById("settings-editor").close();
    dialog.showModal();
    const localHost = ["127.0.0.1", "localhost", "[::1]"].includes(
      location.hostname,
    );
    if (
      !bridge.enabled ||
      !["http:", "https:"].includes(location.protocol) ||
      (location.protocol !== "https:" && !localHost)
    ) {
      $("account-auth").hidden = true;
      $("account-workspace").hidden = true;
      status(
        "Account sign-in is disabled in this preview. Use the account server on your PC; phone sign-in will require HTTPS. Your phone schedule stays in this browser.",
      );
      return;
    }
    run(connectAccount);
  });
  $("account-close").onclick = () => dialog.close();
  dialog.addEventListener("cancel", (event) => {
    if (busy) event.preventDefault();
  });
  dialog.addEventListener("close", () => {
    $("account-password").value = "";
    document.getElementById("profile")?.focus();
  });
  $("account-auth").onsubmit = (event) => {
    event.preventDefault();
    const mode = event.submitter?.value === "register" ? "register" : "login";
    run(async () => {
      try {
        account = await api(mode, {
          username: $("account-name").value.trim(),
          password: $("account-password").value,
        });
        await connectAccount();
      } finally {
        $("account-password").value = "";
      }
    });
  };
  function confirmSync() {
    if (!$("account-confirm").checked)
      throw new Error(
        "Select the confirmation above, then choose save or load.",
      );
    if (!account || revision === null)
      throw new Error("Reconnect your account before syncing.");
  }
  $("account-upload").onclick = () =>
    run(async () => {
      confirmSync();
      const snapshot = bridge.snapshot();
      const result = await api("workspace", {
        revision,
        data: JSON.parse(snapshot),
      });
      revision = result.revision;
      status(
        bridge.snapshot() === snapshot
          ? "Saved to your account."
          : "Saved that snapshot. You have newer local edits to save.",
      );
    });
  $("account-download").onclick = () =>
    run(async () => {
      confirmSync();
      const before = bridge.snapshot();
      const remote = await api("workspace");
      if (!remote.data)
        throw new Error("This account has no saved workspace yet.");
      await bridge.load(JSON.stringify(remote.data), before);
      revision = remote.revision;
      status(
        "Loaded your account workspace. The previous local copy is available as a backup.",
      );
    });
  $("account-logout").onclick = () =>
    run(async () => {
      await api("logout", {});
      account = null;
      revision = null;
      status("Signed out. Your local schedule remains on this device.");
    });
  $("account-backup").onclick = () => {
    const backup = bridge.backup();
    if (!backup) return;
    const url = URL.createObjectURL(
      new Blob([backup], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "scheduler-before-account-load.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  paint();
})();
