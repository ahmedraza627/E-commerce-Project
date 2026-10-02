import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside `containerRef` while `active` is true:
 *  - Tab / Shift+Tab cycle within the container (never escapes to the page)
 *  - Escape invokes `onClose` (Esc or any dismissal path)
 *  - On activation, stores document.activeElement (the trigger) and focuses
 *    the first focusable element; on deactivation, restores focus to it.
 */
export default function useFocusTrap({ active, onClose }) {
  const containerRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    // Remember the trigger element so we can hand focus back on close.
    restoreFocusRef.current = document.activeElement;

    const container = containerRef.current;
    const focusFirst = () => {
      const nodes = container?.querySelectorAll(FOCUSABLE);
      if (nodes?.length) nodes[0].focus();
      else container?.focus?.();
    };
    // rAF: wait a tick so the drawer/panel has painted its DOM.
    const raf = requestAnimationFrame(focusFirst);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const nodes = container?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const list = Array.from(nodes);
      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === first || !container.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true); // capture: wins over page handlers
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown, true);
      // Restore focus to wherever the user opened the overlay from.
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [active, onClose]);

  return containerRef;
}
