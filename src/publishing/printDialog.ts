export function getPrintDialogHtml(previewHtml: string): string {
  return `
    <div class="status-shell no-print" role="status" aria-live="polite">
      <div class="status-title">Printing…</div>
      <div class="status-subtitle">The system print dialog should open automatically.</div>
      <div class="status-subtitle">This window may pause while it’s open.</div>
    </div>

    <!-- Keep print content offscreen; it becomes visible only for printing -->
    <div class="print-content" id="printRoot">
      ${previewHtml}
    </div>

    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        font-family: sans-serif;
      }

      .status-shell {
        width: 460px;
        max-width: calc(100vw - 24px);
        padding: 14px 16px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.12);
        box-sizing: border-box;
        white-space: normal;
        overflow: visible;
      }

      .status-title {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 6px;
      }

      .status-subtitle {
        font-size: 12px;
        color: #444;
        margin-top: 2px;
        line-height: 1.35;
        word-break: break-word;
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
      }

      /* Make sure hidden content doesn't force a huge dialog */
      .print-content {
        position: absolute;
        left: -100000px;
        top: 0;
        width: auto;
        height: auto;
        overflow: visible;
      }

      @media print {
        .no-print { display: none !important; }
        html, body { background: white !important; }

        .print-content {
          position: static;
          width: auto;
          height: auto;
          overflow: visible;
        }
      }
    </style>
  `;
}

