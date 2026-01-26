// Print dialog webview script
// This runs in a dedicated Joplin dialog webview, so calling window.print()
// won't freeze the main Joplin window.

(window as any).exports = {};

(function () {
  if ((window as any).__publishingPrintDialogInitialized) return;
  (window as any).__publishingPrintDialogInitialized = true;

  const logPrefix = '[PublishingPrintDialog]';
  const now = () => new Date().toISOString();
  const log = (...args: any[]) => console.info(logPrefix, now(), ...args);
  const warn = (...args: any[]) => console.warn(logPrefix, now(), ...args);
  const err = (...args: any[]) => console.error(logPrefix, now(), ...args);

  log('Script loaded.', {
    readyState: document.readyState,
    hasWindowPrint: typeof (window as any).print === 'function',
    userAgent: navigator.userAgent,
  });

  // Helpful lifecycle hooks (not supported everywhere, but cheap to log)
  (window as any).onbeforeprint = () => log('beforeprint fired.');
  (window as any).onafterprint = () => log('afterprint fired.');

  function fragmentContentIntoPages() {
    const source = document.getElementById('contentSource');
    const container = document.getElementById('pageContainer');
    const template = document.getElementById('pageTemplate') as HTMLTemplateElement | null;
    if (!source || !container || !template) {
      warn('Pagination prerequisites missing.', {
        hasContentSource: !!source,
        hasPageContainer: !!container,
        hasPageTemplate: !!template,
      });
      return;
    }

    // Preserve title page if present
    const titlePage = document.getElementById('titlePageContainer');
    container.innerHTML = '';
    if (titlePage) container.appendChild(titlePage);

    const children = Array.from(source.children);
    let currentPageNum = titlePage ? 2 : 1;

    const createNewPage = () => {
      const clone = template.content.cloneNode(true) as HTMLElement;
      const contentArea = (clone as any).querySelector('.content-area') as HTMLElement | null;
      const pageNumSpan = (clone as any).querySelector('.page-number') as HTMLElement | null;
      if (pageNumSpan) pageNumSpan.textContent = String(currentPageNum);
      container.appendChild(clone);
      currentPageNum++;
      return contentArea;
    };

    let contentArea = createNewPage();
    if (!contentArea) return;

    for (const child of children) {
      // Manual page break marker
      if (child.textContent?.trim() === '---page-break---') {
        contentArea = createNewPage();
        if (!contentArea) return;
        continue;
      }

      const childClone = child.cloneNode(true) as HTMLElement;
      contentArea.appendChild(childClone);

      // If overflowed, move the element to a new page (unless it's the only element)
      if (contentArea.scrollHeight > contentArea.offsetHeight) {
        if (contentArea.children.length > 1) {
          childClone.remove();
          contentArea = createNewPage();
          if (!contentArea) return;
          contentArea.appendChild(childClone);
        }
      }
    }

    log('Pagination complete.', {
      pages: container.querySelectorAll('.virtual-page').length,
      hasTitlePage: !!titlePage,
    });
  }

  function showAllPagesForPrint() {
    const pages = document.querySelectorAll('#pageContainer .virtual-page');
    pages.forEach((p) => {
      (p as HTMLElement).style.display = 'block';
      (p as HTMLElement).style.marginBottom = '0';
    });
    log('Prepared pages for print.', { pageCount: pages.length });
  }

  function safePrint() {
    try {
      log('safePrint start.');
      // Ensure pagination is built before printing
      fragmentContentIntoPages();
      showAllPagesForPrint();

      // Give the browser a tick to layout before opening the print dialog
      setTimeout(() => {
        try {
          log('Calling window.print()...');
          window.print();
          log('window.print() returned (dialog may still be open).');
        } catch (e) {
          err('Print failed:', e);
        }
      }, 350);
    } catch (e) {
      err('Failed preparing print output:', e);
    }
  }

  // Bind print button (if present)
  document.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    if (target.id === 'printNowButton') {
      ev.preventDefault();
      safePrint();
    }
  });

  const startAutoPrint = (reason: string) => {
    log(`Starting auto-print (${reason}).`);
    // Some environments need a small delay before print() will show the dialog.
    setTimeout(() => safePrint(), 250);
  };

  // Auto-open the system print dialog as soon as the window is ready.
  // IMPORTANT: In Joplin, scripts may be injected after the document is already "complete",
  // which means the 'load' event has already fired. Handle both cases.
  if (document.readyState === 'complete') {
    startAutoPrint('document.readyState === complete (load already fired)');
  } else {
    window.addEventListener('load', () => {
      log('Window load event fired.');
      startAutoPrint('window load event');
    });
    document.addEventListener('DOMContentLoaded', () => {
      log('DOMContentLoaded fired.');
      // Don't start here; just log. Printing is still tied to load/complete.
    });
  }
})();

