type ActivationListener = () => void;

const listeners = new Set<ActivationListener>();

/** Open the building activation popup (used when a locked user tries an action). */
export function requestActivationPopup() {
  listeners.forEach((listener) => listener());
}

export function subscribeActivationPopup(listener: ActivationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isBuildingLockError(message?: string | null) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('building is locked') ||
    text.includes('trial or subscription has ended') ||
    text.includes('contact support to reactivate') ||
    text.includes('start a free trial') ||
    text.includes('support to activate')
  );
}
