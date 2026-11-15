/** The signal dock is a full-screen positioning frame, not a reading surface. */
export function controllerScrollTarget(app, dialog = null) {
  if (dialog) return dialog;
  const selectors = ['.discovery-camera__reading', '.upload-terminal > .story-shell', '.brief-ending', '.interaction-dock'];
  for (const selector of selectors) {
    const element = app?.querySelector(selector);
    if (element && element.scrollHeight > element.clientHeight + 1) return element;
  }
  return null;
}
