
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
      
      // Fragment content into virtual pages and scale to fit
      setTimeout(() => {
        fragmentContentIntoPages();
        scalePreviewToFit();
      }, 100);

      window.onresize = () => scalePreviewToFit();

      closePreviewBtn.onclick = () => {
        console.info('DEBUG: closePreviewButton clicked.');
        (window as any).webviewApi.postMessage({ type: 'closePreview' });
      };
      
      const refreshPreviewBtn = document.getElementById('refreshButton');
      if (refreshPreviewBtn) {
        refreshPreviewBtn.onclick = () => {
          console.info('DEBUG: refreshPreviewButton clicked.');
          (window as any).webviewApi.postMessage({ type: 'refreshPreview' });
        };
      }

      const printBtn = document.getElementById('printButton');
      if (printBtn) {
        printBtn.onclick = () => {
          console.info('DEBUG: printButton clicked. Triggering window.print().');
          window.print();
        };
      }

      // Reset print state after dialog closes (Strategy B from Electron docs)
      window.onafterprint = () => {
        console.info('DEBUG: Afterprint event detected. Requesting refresh.');
        (window as any).webviewApi.postMessage({ type: 'refreshPreview' });
      };
    }
  }

  function fragmentContentIntoPages() {
    const source = document.getElementById('contentSource');
    const container = document.getElementById('pageContainer');
    const template = document.getElementById('pageTemplate') as HTMLTemplateElement;
    if (!source || !container || !template) return;

    // Clear any previous fragmentation (except title page)
    const titlePage = document.getElementById('titlePageContainer');
    container.innerHTML = '';
    if (titlePage) container.appendChild(titlePage);

    const children = Array.from(source.children);
    let currentPageNum = 2;

    const createNewPage = () => {
      const clone = template.content.cloneNode(true) as HTMLElement;
      const page = clone.querySelector('.virtual-page') as HTMLElement;
      const contentArea = clone.querySelector('.content-area') as HTMLElement;
      const pageNumSpan = clone.querySelector('.page-number');
      if (pageNumSpan) pageNumSpan.textContent = currentPageNum.toString();
      
      container.appendChild(clone);
      currentPageNum++;
      return { page, contentArea };
    };

    let { page, contentArea } = createNewPage();
    const maxPageHeight = contentArea.offsetHeight || (297 * 3.78) - (5 * 37.8); // fallback: A4 pixels - margins

    for (const child of children) {
      const childClone = child.cloneNode(true) as HTMLElement;
      contentArea.appendChild(childClone);

      // Check for overflow
      if (contentArea.scrollHeight > contentArea.offsetHeight) {
        // If this element alone is too big, it stays but overflows (better than loop)
        if (contentArea.children.length > 1) {
          // Move the child to a new page
          childClone.remove();
          const newTarget = createNewPage();
          page = newTarget.page;
          contentArea = newTarget.contentArea;
          contentArea.appendChild(childClone);
        }
      }
    }
    
    console.info(`DEBUG: Fragmented into ${currentPageNum - 1} pages.`);
  }

  function scalePreviewToFit() {
    const holder = document.getElementById('previewContentHolder');
    const body = document.getElementById('previewBody');
    if (!holder || !body) return;

    // The A4 page width in pixels (approx)
    const pageWidth = 210 * 3.78; 
    const padding = 80; // 40px each side
    const availableWidth = body.offsetWidth - padding;
    
    if (availableWidth <= 0) return;

    const scale = Math.min(1, availableWidth / pageWidth);
    holder.style.transform = `scale(${scale})`;
    
    // Adjust height of the holder so scrolling works correctly
    const originalHeight = holder.scrollHeight;
    body.style.minHeight = `${(originalHeight * scale) + padding}px`;
    
    console.info(`DEBUG: Scaled preview to ${Math.round(scale * 100)}%`);
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
