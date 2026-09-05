(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const seen = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('site-reveal');
      target.addEventListener('animationend', () => target.classList.remove('site-reveal'), { once: true });
      observer.unobserve(target);
    });
  }, { threshold: 0.08 });
  const selector = 'main section, main article, main a.rounded-2xl, main a.rounded-3xl';
  function observe(root) {
    const candidates = [...root.querySelectorAll(selector)];
    if (root.matches?.(selector)) candidates.unshift(root);
    candidates.forEach(element => {
      if (seen.has(element)) return;
      seen.add(element);
      observer.observe(element);
    });
  }
  observe(document);
  const mutations = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1) observe(node);
    }));
  });
  mutations.observe(document.body, { childList: true, subtree: true });
  reduced.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); mutations.disconnect(); }
  });
})();
