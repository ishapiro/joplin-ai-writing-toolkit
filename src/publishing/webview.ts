
// Publishing Panel Webview Script

// declare const webviewApi: any; // Handled globally via window

// Hack to fix "exports is not defined" error if webpack adds commonjs exports
(window as any).exports = {};

(function() {
  const previewButton = document.getElementById('previewButton');
  const refreshButton = document.getElementById('refreshButton');
  const closeButton = document.getElementById('closeButton');

  // Input mapping
  const inputIds = {
    title: 'docTitle',
    subtitle: 'docSubtitle',
    author: 'docAuthor',
    date: 'docDate',
    logo: 'docLogo',
    page_size: 'pageSize',
    margin: 'pageMargin',
    header: 'headerText',
    footer: 'footerText',
    show_page_numbers: 'showPageNumbers'
  };

  // Helper to get input value
  function getVal(id: string): string {
    const el = document.getElementById(id) as HTMLInputElement;
    return el ? el.value : '';
  }

  // Helper to set input value
  function setVal(id: string, val: string | undefined) {
    const el = document.getElementById(id) as HTMLInputElement;
    if (el) el.value = val || '';
  }

  // Helper to get checkbox
  function getCheck(id: string): boolean {
    const el = document.getElementById(id) as HTMLInputElement;
    return el ? el.checked : false;
  }

  // Helper to set checkbox
  function setCheck(id: string, val: boolean | undefined) {
    const el = document.getElementById(id) as HTMLInputElement;
    if (el) el.checked = !!val;
  }

  // Gather all settings from inputs
  function getSettings() {
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
  }

  // Send update to plugin (debounced)
  let debounceTimer: any;
  function notifyChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      webviewApi.postMessage({
        type: 'updateNoteMetadata',
        settings: getSettings()
      });
    }, 500); // 500ms debounce
  }

  // Attach listeners to all inputs
  Object.values(inputIds).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', notifyChange); // covers text and number inputs
      el.addEventListener('change', notifyChange); // covers select and checkbox
    }
  });

  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      webviewApi.postMessage({
        type: 'refreshFromNote'
      });
    });
  }

  if (previewButton) {
    previewButton.addEventListener('click', () => {
      webviewApi.postMessage({
        type: 'generatePreview',
        settings: getSettings()
      });
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      webviewApi.postMessage({
        type: 'closePublishingPanel'
      });
    });
  }

  // Handle messages from plugin
  webviewApi.onMessage((message: any) => {
    console.info('Publishing webview received message:', message);
    
    // Handle the case where message is wrapped in a 'message' property
    const actualMessage = message.message || message;
    
    if (actualMessage && actualMessage.type === 'updatePanelFields') {
      const s = actualMessage.settings || {};
      console.info('Updating panel fields with settings:', s);
      
      setVal(inputIds.title, s.title);
      setVal(inputIds.subtitle, s.subtitle);
      setVal(inputIds.author, s.author);
      setVal(inputIds.date, s.date);
      setVal(inputIds.logo, s.logo);
      setVal(inputIds.page_size, s.page_size || 'Letter'); // Default fallback
      setVal(inputIds.margin, s.margin || '2.5'); // Default fallback
      setVal(inputIds.header, s.header);
      setVal(inputIds.footer, s.footer);
      
      // Special handling for checkbox: if undefined, default to true, else use value
      if (s.show_page_numbers === undefined) {
        setCheck(inputIds.show_page_numbers, true);
      } else {
        setCheck(inputIds.show_page_numbers, s.show_page_numbers);
      }
    }
  });

})();
