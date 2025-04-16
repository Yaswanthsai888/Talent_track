export const getBrowserFingerprint = async () => {
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    touchSupport: ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
    timestamp: new Date().getTime()
  };

  return JSON.stringify(fingerprint);
};

export const detectTabChange = (callback) => {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      callback('tab_switch');
    }
  });
};
