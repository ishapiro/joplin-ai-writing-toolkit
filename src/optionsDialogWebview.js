(function () {
  if (window.__aiWritingToolkitOptionsDialogInitialized) return;
  window.__aiWritingToolkitOptionsDialogInitialized = true;

  function bindOnce(el, event, handler, key) {
    if (!el) return;
    const marker = key || `__bound_${event}`;
    if (el[marker]) return;
    el.addEventListener(event, handler);
    el[marker] = true;
  }

  function bind() {
    const modal = document.getElementById('systemPromptModal');
    const openBtn = document.getElementById('editSystemPromptButton');
    const closeBtn = document.getElementById('closePromptModal');
    const cancelBtn = document.getElementById('cancelPromptEdit');
    const doneBtn = document.getElementById('savePromptEdit');

    function openModal() {
      if (modal) modal.style.display = 'flex';
    }

    function closeModal() {
      if (modal) modal.style.display = 'none';
    }

    bindOnce(openBtn, 'click', openModal, '__bound_open');
    bindOnce(closeBtn, 'click', closeModal, '__bound_close');
    bindOnce(cancelBtn, 'click', closeModal, '__bound_cancel');
    bindOnce(doneBtn, 'click', closeModal, '__bound_done');

    if (modal) {
      bindOnce(
        modal,
        'click',
        (e) => {
          if (e.target === modal) closeModal();
        },
        '__bound_backdrop'
      );
    }
  }

  // The dialog HTML can be replaced via setHtml(), so we re-bind when DOM changes.
  const observer = new MutationObserver(() => bind());
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial bind
  bind();
})();

