'use strict';
// Direct download links and native disclosures work without JavaScript.
// Keeping only one guide open helps on small screens without hiding any download.
const guides = [...document.querySelectorAll('.help-list details')];
for (const guide of guides) {
  guide.addEventListener('toggle', () => {
    if (guide.open) for (const other of guides) if (other !== guide) other.open = false;
  });
}
