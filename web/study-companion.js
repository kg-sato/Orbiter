// Only the exact opener may control this companion. No storage or account access.
(() => {
  const token = location.hash.slice(1),
    origin = location.origin;
  let snapshot = null,
    lastSeen = 0,
    disconnected = false;
  const $ = (id) => document.getElementById(id);
  // Heartbeats update the countdown; announce only a change in session state.
  const status = (message) => {
    if ($("status").textContent !== message) $("status").textContent = message;
  };
  const command = (action, extra = {}) => {
    if (!window.opener || window.opener.closed) return;
    window.opener.postMessage(
      { kind: "orbit-command", token, action, ...extra },
      origin === "null" ? "*" : origin,
    );
  };
  window.addEventListener("message", (event) => {
    if (
      event.source !== window.opener ||
      event.origin !== origin ||
      event.data?.token !== token
    )
      return;
    if (event.data.kind === "orbit-disconnect") {
      disconnected = true;
      draw();
      return;
    }
    if (event.data.kind !== "orbit-state") return;
    snapshot = event.data;
    lastSeen = Date.now();
    disconnected = false;
    draw();
  });
  const draw = () => {
    const connected =
      !!snapshot &&
      !disconnected &&
      !!window.opener &&
      !window.opener.closed &&
      Date.now() - lastSeen < 90000;
    $("toggle").disabled =
      $("return").disabled =
      $("practice").disabled =
      $("practice-go").disabled =
        !connected;
    if (!connected) {
      status("Open Scheduler to reconnect");
      $("time").textContent = "--:--";
      document.body.classList.remove("running");
      return;
    }
    const r = snapshot.endAt
      ? Math.max(0, Math.ceil((snapshot.endAt - Date.now()) / 1000))
      : snapshot.remaining;
    const running = !!snapshot.endAt && r > 0;
    document.body.classList.toggle("running", running);
    document.body.classList.toggle("calm", !!snapshot.calm);
    $("time").textContent =
      `${String(Math.floor(r / 60)).padStart(2, "0")}:${String(r % 60).padStart(2, "0")}`;
    $("intention").textContent = snapshot.title;
    $("toggle").textContent = running
      ? "Pause focus"
      : r === 0
        ? "Start again"
        : "Start / resume";
    status(running
      ? "A little energy, moving forward."
      : r === 0
        ? "Take a breath. Your session is complete."
        : "Here when you need a little momentum.");
    $("progress").textContent =
      `${["Seed", "Awakening", "Flow", "Radiance", "Cosmos"][snapshot.level] || "Seed"} \u00b7 ${snapshot.minutesToday}m today`;
    const key = JSON.stringify(snapshot.practice);
    if ($("practice").dataset.key !== key) {
      const old = $("practice").value;
      $("practice").replaceChildren(new Option("Choose a study project", ""));
      for (const task of snapshot.practice || [])
        $("practice").append(
          new Option(
            `${task.title} \u00b7 ${task.minutes}/${task.target}m`,
            task.id,
          ),
        );
      $("practice").value = old;
      $("practice").dataset.key = key;
    }
    $("practice-go").disabled = !$("practice").value;
  };
  $("close").onclick = () => window.close();
  $("toggle").onclick = () => command("timer-toggle");
  $("return").onclick = () => command("return");
  $("practice").onchange = draw;
  $("practice-go").onclick = () =>
    command("focus-practice", { taskId: $("practice").value });
  $("pet").onclick = () => {
    document.body.classList.remove("spark");
    requestAnimationFrame(() => {
      document.body.classList.add("spark");
      setTimeout(() => document.body.classList.remove("spark"), 650);
    });
  };
  setInterval(() => {
    draw();
    if (!snapshot) command("hello");
  }, 1000);
  command("hello");
})();
