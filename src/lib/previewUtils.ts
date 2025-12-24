export function exitPreviewAndCloseWindow(fallbackUrl = '/admin/alunos') {
  try {
    // Clear preview (caller should have already cleared via localStorage)
    // Attempt to close window; works if tab was opened via script
    window.close();
    // Fallback: if window didn't close, navigate to fallback URL after short delay
    setTimeout(() => {
      try {
        if (!window.closed) {
          window.location.href = fallbackUrl;
        }
      } catch (e) {
        // ignore
      }
    }, 250);
  } catch (err) {
    try { window.location.href = fallbackUrl; } catch {}
  }
}
