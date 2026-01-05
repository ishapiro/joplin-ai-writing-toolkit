
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
      
      // Handle page numbers and footers in preview with a slight delay 
      // to allow for content rendering and height calculation
      setTimeout(() => setupPreviewPageMarkers(), 300);

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
    }
  }

  function setupPreviewPageMarkers() {
    const previewPage = document.querySelector('.preview-page') as HTMLElement;
    const contentArea = document.querySelector('.content') as HTMLElement;
    const titlePage = document.querySelector('.title-page') as HTMLElement;
    const footerTemplate = document.getElementById('footerTemplate');
    const headerOriginal = document.getElementById('headerOriginal');
    
    if (!previewPage || !contentArea || !titlePage) return;

    // 1. Clean up existing markers
    document.querySelectorAll('.preview-spacer').forEach(el => el.remove());
    document.querySelectorAll('.generated-marker').forEach(el => el.remove());

    // 2. Determine page height
    // We'll use a fixed mapping or look for a marker if we had one.
    // For now, let's look at the title-page height which we set to calc(pageHeight - 60px)
    const titlePageHeight = titlePage.offsetHeight;
    const pageHeightPx = titlePageHeight + 60; // Restore the 60px top padding to get full height

    console.info(`DEBUG: setupPreviewPageMarkers - pageHeightPx: ${pageHeightPx}`);

    const getFooterHtml = (pageNumber: number) => {
      if (!footerTemplate) return '';
      let html = footerTemplate.innerHTML;
      return html.replace(/<span class="pageNumber"><\/span>/g, pageNumber.toString());
    };

    const getHeaderHtml = () => {
      return headerOriginal ? headerOriginal.innerHTML : '';
    };

    // 3. Create spacer after Title Page (Page 1 -> Page 2)
    const firstSpacer = document.createElement('div');
    firstSpacer.className = 'preview-spacer';
    firstSpacer.innerHTML = `
      <div class="spacer-footer">${getFooterHtml(1)}</div>
      <div class="spacer-line"></div>
      <div class="spacer-header">${getHeaderHtml()}</div>
    `;
    titlePage.after(firstSpacer);

    // 4. Iterate through content and insert spacers
    let currentPage = 2;
    let currentAccumulatedHeight = 0;
    // The first element of content starts at the top of Page 2.
    // We want to avoid exceeding (pageHeightPx - 60px - 80px) of actual content per page
    // to account for the header (60px) and footer (80px) space.
    const maxContentHeightPerPage = pageHeightPx - 140; 

    const children = Array.from(contentArea.children);
    for (const child of children) {
      const childHeight = (child as HTMLElement).offsetHeight;
      
      // If this single element is taller than a whole page, we can't do much without splitting it,
      // but we'll at least put it on its own page.
      if (currentAccumulatedHeight + childHeight > maxContentHeightPerPage && currentAccumulatedHeight > 0) {
        // Insert spacer before this element
        const spacer = document.createElement('div');
        spacer.className = 'preview-spacer';
        spacer.innerHTML = `
          <div class="spacer-footer">${getFooterHtml(currentPage)}</div>
          <div class="spacer-line"></div>
          <div class="spacer-header">${getHeaderHtml()}</div>
        `;
        child.before(spacer);
        
        currentPage++;
        currentAccumulatedHeight = 0;
      }
      
      currentAccumulatedHeight += childHeight;
    }

    // 5. Add final footer
    const finalFooter = document.createElement('div');
    finalFooter.className = 'footer generated-marker';
    finalFooter.style.position = 'relative';
    finalFooter.style.marginTop = '40px';
    finalFooter.innerHTML = getFooterHtml(currentPage);
    contentArea.appendChild(finalFooter);
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
