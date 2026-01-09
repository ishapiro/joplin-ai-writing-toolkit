
// Combined Publishing & Preview Script
// Registered once, handles all DOM changes automatically.

(window as any).exports = {};

(function() {
  if ((window as any).__publishingWebviewInitialized) return;
  (window as any).__publishingWebviewInitialized = true;

  console.log('Publishing toolkit script active.');
  console.log('DEBUG: PDF Publishing Panel - webview.js loaded successfully');
  console.log('DEBUG: Include Title Page checkbox support: ENABLED');

  let currentPageIndex = 0;
  let totalPages = 0;
  let isInternalChange = false;

  // This function binds all listeners based on what's currently in the DOM
  function bindListeners() {
    console.log('bindListeners: Checking DOM...');
    console.log('DEBUG: bindListeners - Checking for includeTitlePage checkbox...');

    // 1. Settings Mode Elements
    const previewButton = document.getElementById('previewButton');
    if (previewButton) {
      console.log('bindListeners: Settings mode detected.');
      const inputIds = {
        title: 'docTitle', subtitle: 'docSubtitle', author: 'docAuthor', 
        date: 'docDate', logo: 'docLogo', page_size: 'pageSize', 
        margin: 'pageMargin', header: 'headerText', footer: 'footerText', 
        show_page_numbers: 'showPageNumbers', include_title_page: 'includeTitlePage'
      };
      
      console.log('DEBUG: Settings mode detected - inputIds:', inputIds);
      
      const includeTitlePageCheckbox = document.getElementById('includeTitlePage');
      if (includeTitlePageCheckbox) {
        console.log('DEBUG: ✓ Include Title Page checkbox FOUND in DOM');
        console.log('DEBUG: Checkbox element:', includeTitlePageCheckbox);
        console.log('DEBUG: Checkbox checked state:', (includeTitlePageCheckbox as HTMLInputElement).checked);
      } else {
        console.error('DEBUG: ✗ Include Title Page checkbox NOT FOUND in DOM!');
        console.error('DEBUG: Available elements in Title Page section:', 
          document.querySelector('.settings-group h4')?.textContent);
      }

      const getSettings = () => {
        const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value || '';
        const getCheck = (id: string) => (document.getElementById(id) as HTMLInputElement)?.checked || false;
        const settings = {
          title: getVal(inputIds.title),
          subtitle: getVal(inputIds.subtitle),
          author: getVal(inputIds.author),
          date: getVal(inputIds.date),
          logo: getVal(inputIds.logo),
          page_size: getVal(inputIds.page_size),
          margin: getVal(inputIds.margin),
          header: getVal(inputIds.header),
          footer: getVal(inputIds.footer),
          show_page_numbers: getCheck(inputIds.show_page_numbers),
          include_title_page: getCheck(inputIds.include_title_page)
        };
        console.log('DEBUG: getSettings() called - include_title_page:', settings.include_title_page);
        return settings;
      };

      previewButton.onclick = () => {
        (window as any).webviewApi.postMessage({ type: 'generatePreview', settings: getSettings() });
      };

      const refreshBtn = document.getElementById('refreshButton');
      if (refreshBtn) refreshBtn.onclick = () => (window as any).webviewApi.postMessage({ type: 'refreshFromNote' });

      const closePanelBtn = document.getElementById('closePanelButton');
      if (closePanelBtn) {
        closePanelBtn.onclick = async () => {
          try {
            await (window as any).webviewApi.postMessage({ type: 'closePanel' });
            console.log('Close panel requested');
          } catch (error) {
            console.error('Error closing panel:', error);
          }
        };
      }

      // Bind action buttons (like Help button)
      document.querySelectorAll('.action-button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const action = btn.getAttribute('data-action') || '';
          if (action === 'showHelp') {
            const modal = document.getElementById('help-modal');
            if (modal) modal.style.display = 'block';
          }
        });
      });

      const closeHelpBtn = document.getElementById('close-help-modal');
      if (closeHelpBtn) {
        closeHelpBtn.onclick = () => {
          const modal = document.getElementById('help-modal');
          if (modal) modal.style.display = 'none';
        };
      }

      const okHelpBtn = document.getElementById('ok-help-modal');
      if (okHelpBtn) {
        okHelpBtn.onclick = () => {
          const modal = document.getElementById('help-modal');
          if (modal) modal.style.display = 'none';
        };
      }

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
      // Per user request: Return to settings panel after print instead of refreshing preview
      window.onafterprint = () => {
        console.info('DEBUG: Afterprint event detected. Returning to settings.');
        (window as any).webviewApi.postMessage({ type: 'closePreview' });
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
    // Start page numbering at 2 if title page exists, otherwise start at 1
    let currentPageNum = titlePage ? 2 : 1;

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
      // Manual page break support: check if element is a page break marker
      if (child.textContent?.trim() === '---page-break---') {
        const newTarget = createNewPage();
        page = newTarget.page;
        contentArea = newTarget.contentArea;
        continue;
      }

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

    // Use ResizeObserver for more reliable dimension tracking
    if (!(window as any).__previewResizeObserver) {
      (window as any).__previewResizeObserver = new ResizeObserver(() => {
        if (!isInternalChange) scalePreviewToFit();
      });
      (window as any).__previewResizeObserver.observe(body);
    }

    // Find the currently visible page to get accurate dimensions
    const pages = document.querySelectorAll('#pageContainer .virtual-page');
    let activePage = null;
    for (const p of Array.from(pages)) {
      if ((p as HTMLElement).style.display !== 'none') {
        activePage = p as HTMLElement;
        break;
      }
    }

    // If no page is visible (shouldn't happen) or we're on the first measurement,
    // temporarily show the first page to measure it
    let pageWidth, pageHeight;
    if (activePage && activePage.offsetWidth > 0) {
      pageWidth = activePage.offsetWidth;
      pageHeight = activePage.offsetHeight;
    } else {
      const firstPage = pages[0] as HTMLElement;
      if (!firstPage) return;
      
      // Measure properly even if hidden
      const prevDisplay = firstPage.style.display;
      const prevVisibility = firstPage.style.visibility;
      const prevPosition = firstPage.style.position;
      
      firstPage.style.display = 'block';
      firstPage.style.visibility = 'hidden';
      firstPage.style.position = 'absolute';
      
      pageWidth = firstPage.offsetWidth;
      pageHeight = firstPage.offsetHeight;
      
      firstPage.style.display = prevDisplay;
      firstPage.style.visibility = prevVisibility;
      firstPage.style.position = prevPosition;
    }

    if (pageWidth <= 0 || pageHeight <= 0) {
      // Hard fallback to A4/Letter approx if measurement fails
      pageWidth = 210 * 3.78; 
      pageHeight = 297 * 3.78;
    }

    const padding = 40; 
    const availableWidth = body.offsetWidth - padding;
    const availableHeight = body.offsetHeight - padding;
    
    console.info(`DEBUG: scalePreviewToFit dimensions - body: ${body.offsetWidth}x${body.offsetHeight}, page: ${pageWidth}x${pageHeight}`);

    if (availableWidth <= 0 || availableHeight <= 0) {
      // If we don't have dimensions yet, try again shortly (max 10 retries)
      const retries = (window as any).__scaleRetries || 0;
      if (retries < 10) {
        (window as any).__scaleRetries = retries + 1;
        setTimeout(scalePreviewToFit, 100);
      }
      return;
    }
    (window as any).__scaleRetries = 0;

    // Scale to fit BOTH width and height for a single page
    const scaleX = availableWidth / pageWidth;
    const scaleY = availableHeight / pageHeight;
    const scale = Math.min(1, scaleX, scaleY);

    holder.style.transform = `scale(${scale})`;
    
    console.info(`DEBUG: Scaled preview to ${Math.round(scale * 100)}% on page ${currentPageIndex + 1}`);
  }

  // Function to show a nicely formatted close message
  function showCloseMessage() {
    const settingsScrollArea = document.querySelector('.settings-scroll-area');
    if (!settingsScrollArea) return;

    // Clear the settings area and show a formatted close message
    settingsScrollArea.innerHTML = '';
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 8px;
      margin: 20px;
      border: 1px solid #28a745;
      min-height: 200px;
    `;
    
    messageDiv.innerHTML = `
      <p style="color: #495057; font-size: 14px; margin-bottom: 15px;">To reopen this panel:</p>
      <div style="color: #495057; font-size: 13px; line-height: 1.4; margin-bottom: 20px;">
        <strong>1.</strong> Select <strong>Tools</strong> from the menu bar<br>
        <strong>2.</strong> Click <strong>Cogitations Plugins</strong><br>
        <strong>3.</strong> Select <strong>PDF Publishing Settings</strong>
      </div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="confirmCloseButton" style="padding: 8px 16px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; background: #28a745; color: white; font-weight: 500;">Close Panel</button>
        <button id="cancelCloseButton" style="padding: 8px 16px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; background: #6c757d; color: white; font-weight: 500;">Keep Open</button>
      </div>
    `;
    
    settingsScrollArea.appendChild(messageDiv);
    
    // Add event listeners for the buttons
    const confirmBtn = document.getElementById('confirmCloseButton');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        try {
          await (window as any).webviewApi.postMessage({
            type: 'confirmClose'
          });
        } catch (error) {
          console.error('Error confirming close:', error);
        }
      });
      
      // Add hover effects
      confirmBtn.addEventListener('mouseenter', () => {
        (confirmBtn as HTMLElement).style.background = '#218838';
        (confirmBtn as HTMLElement).style.transform = 'translateY(-1px)';
        (confirmBtn as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      });
      confirmBtn.addEventListener('mouseleave', () => {
        (confirmBtn as HTMLElement).style.background = '#28a745';
        (confirmBtn as HTMLElement).style.transform = 'translateY(0)';
        (confirmBtn as HTMLElement).style.boxShadow = 'none';
      });
    }
    
    const cancelBtn = document.getElementById('cancelCloseButton');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', async () => {
        try {
          // Reload the panel HTML to restore settings
          await (window as any).webviewApi.postMessage({
            type: 'cancelClose'
          });
        } catch (error) {
          console.error('Error canceling close:', error);
        }
      });
      
      // Add hover effects
      cancelBtn.addEventListener('mouseenter', () => {
        (cancelBtn as HTMLElement).style.background = '#5a6268';
        (cancelBtn as HTMLElement).style.transform = 'translateY(-1px)';
        (cancelBtn as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        (cancelBtn as HTMLElement).style.background = '#6c757d';
        (cancelBtn as HTMLElement).style.transform = 'translateY(0)';
        (cancelBtn as HTMLElement).style.boxShadow = 'none';
      });
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
        setCheck('includeTitlePage', s.include_title_page !== false);
        console.log('DEBUG: updatePanelFields - include_title_page value:', s.include_title_page, 'checkbox checked:', (document.getElementById('includeTitlePage') as HTMLInputElement)?.checked);
      } else if (actualMessage.type === 'showCloseMessage') {
        showCloseMessage();
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
