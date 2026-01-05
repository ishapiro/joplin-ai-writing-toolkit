
// Combined Publishing & Preview Script
// Registered once, handles all DOM changes automatically.

(window as any).exports = {};

(function() {
  if ((window as any).__publishingWebviewInitialized) return;
  (window as any).__publishingWebviewInitialized = true;

  console.log('Publishing toolkit script active.');

  let currentPageIndex = 0;
  let totalPages = 0;
  let isInternalChange = false;

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
      
      // Only fragment if content is truly new (prevents loop)
      const pageContainer = document.getElementById('pageContainer');
      const alreadyFragmented = pageContainer && pageContainer.querySelectorAll('.virtual-page').length > 1;

      if (!alreadyFragmented) {
        console.info('DEBUG: Fresh preview detected. Fragmenting...');
        currentPageIndex = 0; 
        setTimeout(() => {
          fragmentContentIntoPages();
          scalePreviewToFit();
        }, 100);
      } else {
        // Just refresh the view in case buttons were re-bound
        updatePageView();
      }

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
          // Show all pages for printing
          showAllPagesForPrint();
          window.print();
        };
      }

      const prevBtn = document.getElementById('prevPage');
      if (prevBtn) prevBtn.onclick = () => changePage(-1);

      const nextBtn = document.getElementById('nextPage');
      if (nextBtn) nextBtn.onclick = () => changePage(1);

      // Reset print state after dialog closes (Strategy B from Electron docs)
      window.onafterprint = () => {
        console.info('DEBUG: Afterprint event detected. Requesting refresh.');
        (window as any).webviewApi.postMessage({ type: 'refreshPreview' });
      };
    }
  }

  function changePage(delta: number) {
    const newIndex = currentPageIndex + delta;
    if (newIndex >= 0 && newIndex < totalPages) {
      isInternalChange = true;
      currentPageIndex = newIndex;
      updatePageView();
      setTimeout(() => { isInternalChange = false; }, 50);
    }
  }

  function updatePageView() {
    const pages = document.querySelectorAll('#pageContainer .virtual-page');
    pages.forEach((p, idx) => {
      (p as HTMLElement).style.display = (idx === currentPageIndex) ? 'block' : 'none';
      (p as HTMLElement).style.marginBottom = '0'; 
    });

    const info = document.getElementById('pageInfo');
    if (info) info.textContent = `Page ${currentPageIndex + 1} of ${totalPages}`;

    const prevBtn = document.getElementById('prevPage') as HTMLButtonElement;
    const nextBtn = document.getElementById('nextPage') as HTMLButtonElement;
    if (prevBtn) prevBtn.disabled = (currentPageIndex === 0);
    if (nextBtn) nextBtn.disabled = (currentPageIndex === totalPages - 1);

    scalePreviewToFit();
  }

  function showAllPagesForPrint() {
    const pages = document.querySelectorAll('#pageContainer .virtual-page');
    pages.forEach((p) => {
      (p as HTMLElement).style.display = 'block';
      (p as HTMLElement).style.marginBottom = '0';
    });
    const holder = document.getElementById('previewContentHolder');
    if (holder) holder.style.transform = 'none';
  }

  function fragmentContentIntoPages() {
    isInternalChange = true;
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
    
    // Use the actual measured height of the content area for precise pagination
    const maxPageHeight = contentArea.offsetHeight;

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
    
    totalPages = currentPageNum - 1;
    // currentPageIndex is NO LONGER reset to 0 here to preserve state

    const controls = document.getElementById('paginationControls');
    if (controls) controls.style.display = totalPages > 1 ? 'flex' : 'none';

    updatePageView();
    console.info(`DEBUG: Fragmented into ${totalPages} pages.`);
    setTimeout(() => { isInternalChange = false; }, 50);
  }

  function scalePreviewToFit() {
    const holder = document.getElementById('previewContentHolder');
    const body = document.getElementById('previewBody');
    if (!holder || !body) return;

    // Use actual dimensions of the virtual page for scaling
    const firstPage = document.querySelector('.virtual-page') as HTMLElement;
    const pageWidth = firstPage ? firstPage.offsetWidth : 210 * 3.78; 
    const pageHeight = firstPage ? firstPage.offsetHeight : 297 * 3.78;

    const padding = 40; 
    const availableWidth = body.offsetWidth - padding;
    const availableHeight = body.offsetHeight - padding;
    
    if (availableWidth <= 0 || availableHeight <= 0) return;

    // Scale to fit BOTH width and height for a single page
    const scaleX = availableWidth / pageWidth;
    const scaleY = availableHeight / pageHeight;
    const scale = Math.min(1, scaleX, scaleY);

    holder.style.transform = `scale(${scale})`;
    
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
    if (isInternalChange) return;
    bindListeners();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial run
  bindListeners();
})();
