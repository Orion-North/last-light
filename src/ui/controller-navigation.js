/** Collapsed <details> descendants can retain layout rectangles in browsers.
 * Only the first summary remains a controller navigation target while closed. */
export function hiddenByClosedDetails(element) {
  for(let parent=element.parentElement;parent;parent=parent.parentElement) {
    if(parent.tagName!=='DETAILS' || parent.open)continue;
    const summary=[...parent.children].find(child=>child.tagName==='SUMMARY');
    if(!summary?.contains(element))return true;
  }
  return false;
}

export function controllerMenuTargets(root) {
  return [...root.querySelectorAll('button:not([disabled]),input:not([disabled]),summary,a[href]')]
    .filter(element=>!element.hidden && !element.closest('[hidden],[inert]')
      && !hiddenByClosedDetails(element) && element.getClientRects().length);
}
