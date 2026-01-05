
// Combined Publishing & Preview Script
// Registered once, handles all DOM changes automatically.

(window as any).exports = {};

(function() {
  if ((window as any).__publishingWebviewInitialized) return;
  (window as any).__publishingWebviewInitialized = true;

  console.log('Publishing toolkit script active.');

  // This function binds all listeners based on what's currently in the DOM
  function bindListeners() {
    console.log('bindListeners: Checking DOM...');

    // 1. Settings Mode Elements
    const previewButton = document.getElementById('previewButton');
    if (previewButton) {
      console.log('bindListeners: Settings mode detected.');
      const inputIds = {
        title: 'docTitle', subtitle: 'docSubtitle', author: 'docAuthor', 
        date: 'docDate', logo: 'docLogo', page_size: 'pageSize', 
        margin: 'pageMargin', header: 'headerText', footer: 'footerText', 
        show_page_numbers: 'showPageNumbers'
      };

      const getSettings = () => {
        const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
        const getCheck = (id: string) => (document.getElementById(id) as HTMLInputElement)?.checked || false;
        return {
          title: getVal(inputIds.title),
          subtitle: getVal(inputIds.subtitle),
          author: getVal(inputIds.author),
          date: getVal(inputIds.date),
          logo: getVal(inputIds.logo),
          page_size: getVal(inputIds.page_size),
          margin: getVal(inputIds.margin),
          header: getVal(inputIds.header),
          footer: getVal(inputIds.footer),
          show_page_numbers: getCheck(inputIds.show_page_numbers)
        };
      };

      previewButton.onclick = () => {
        (window as any).webviewApi.postMessage({ type: 'generatePreview', settings: getSettings() });
      };

      const refreshBtn = document.getElementById('refreshButton');
      if (refreshBtn) refreshBtn.onclick = () => (window as any).webviewApi.postMessage({ type: 'refreshFromNote' });

      const closeBtn = document.getElementById('closeButton');
      if (closeBtn) closeBtn.onclick = () => (window as any).webviewApi.postMessage({ type: 'closePublishingPanel' });

      // Debounced metadata updates
      let debounceTimer: any;
      const notifyChange = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          (window as any).webviewApi.postMessage({ type: 'updateNoteMetadata', settings: getSettings() });
        }, 500);
      };

      Object.values(inputIds).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.oninput = notifyChange;
          el.onchange = notifyChange;
        }
      });
    }

    // 2. Preview Mode Elements
    const closePreviewBtn = document.getElementById('closePreviewButton');
    if (closePreviewBtn) {
      console.log('bindListeners: Preview mode detected.');
      closePreviewBtn.onclick = () => (window as any).webviewApi.postMessage({ type: 'closePreview' });
      
      const refreshPreviewBtn = document.getElementById('refreshButton');
      if (refreshPreviewBtn) {
        refreshPreviewBtn.onclick = () => (window as any).webviewApi.postMessage({ type: 'refreshPreview' });
      }
    }
  }

  // Handle incoming messages (Single Global Listener)
  if (typeof (window as any).webviewApi !== 'undefined') {
    (window as any).webviewApi.onMessage((message: any) => {
      const actualMessage = message.message || message;
      if (actualMessage.type === 'updatePanelFields') {
        const s = actualMessage.settings || {};
        const setVal = (id: string, val: any) => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.value = val || ''; };
        const setCheck = (id: string, val: any) => { const el = document.getElementById(id) as HTMLInputElement; if (el) el.checked = !!val; };
        
        setVal('docTitle', s.title);
        setVal('docSubtitle', s.subtitle);
        setVal('docAuthor', s.author);
        setVal('docDate', s.date);
        setVal('docLogo', s.logo);
        setVal('pageSize', s.page_size || 'Letter');
        setVal('pageMargin', s.margin || '2.5');
        setVal('headerText', s.header);
        setVal('footerText', s.footer);
        setCheck('showPageNumbers', s.show_page_numbers !== false);
      }
    });
  }

  // MutationObserver detects when setHtml replaces the panel content
  const observer = new MutationObserver(() => {
    bindListeners();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial run
  bindListeners();
})();
