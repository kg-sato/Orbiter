/* One event-driven controller owns background motion and page identity. */
(() => {
  let started = false, artwork, frame = 0, timer = 0, last = 0;
  let pointerX = 0, pointerY = 0, scrollProgress = 0, paused = false, updates = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const shouldPause = () => document.hidden || reduce.matches ||
    ['reduced-motion','calm','quiet','motion-hidden'].some(c => document.body.classList.contains(c)) ||
    document.body.dataset.material === 'quiet' || document.body.dataset.nativeMode === 'buddy';

  function paint() {
    frame = 0; timer = 0; last = performance.now();
    if (!artwork) return;
    const x = paused ? 0 : pointerX * 12;
    const y = paused ? 0 : pointerY * 9 - scrollProgress * 42;
    artwork.style.setProperty('--scene-x', `${x.toFixed(2)}px`);
    artwork.style.setProperty('--scene-y', `${y.toFixed(2)}px`);
    updates++;
  }
  function schedule() {
    if (frame || timer) return;
    const remaining = Math.max(0, 34 - (performance.now() - last));
    if (remaining > 0) timer = setTimeout(() => { timer = 0; frame = requestAnimationFrame(paint); }, remaining);
    else frame = requestAnimationFrame(paint);
  }
  function refresh() {
    const next = shouldPause();
    if (next !== paused) paused = next;
    if (document.body.classList.contains('scene-still') !== paused)
      document.body.classList.toggle('scene-still', paused);
    if (paused) { pointerX = pointerY = 0; clearTimeout(timer); cancelAnimationFrame(frame); timer = frame = 0; paint(); }
    else schedule();
  }
  function reset() { pointerX = pointerY = 0; schedule(); }
  function scroll() {
    scrollProgress = Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
    if (!paused) schedule();
  }
  function start() {
    if (started) return;
    artwork = document.getElementById('liquid-landscape');
    if (!artwork) return;
    started = true;
    document.addEventListener('pointermove', e => {
      if (paused || !fine.matches || e.pointerType === 'touch') return;
      pointerX = Math.max(-1, Math.min(1, e.clientX / innerWidth * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, e.clientY / innerHeight * 2 - 1));
      schedule();
    }, {passive:true});
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    window.addEventListener('scroll', scroll, {passive:true});
    window.addEventListener('resize', scroll, {passive:true});
    document.addEventListener('visibilitychange', refresh);
    reduce.addEventListener('change', refresh);
    fine.addEventListener('change', reset);
    new MutationObserver(refresh).observe(document.body, {attributes:true, attributeFilter:['class','data-material','data-native-mode','data-scene']});
    scroll(); refresh();
  }
  window.OrbiterScene = {start, refresh, stats:() => ({started,paused,updates,page:document.body.dataset.scene,pending:!!(frame||timer)})};
})();
