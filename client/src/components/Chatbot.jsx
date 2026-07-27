import { useEffect } from 'react';

const CHATBASE_SCRIPT_ID = 'mLWHSR9cJu1GCTV_uI-0n';

export default function Chatbot() {
  useEffect(() => {
    let retryTimer = null;
    let retried = false;

    if (!window.chatbase || window.chatbase('getState') !== 'initialized') {
      window.chatbase = (...args) => {
        if (!window.chatbase.q) {
          window.chatbase.q = [];
        }
        window.chatbase.q.push(args);
      };

      window.chatbase = new Proxy(window.chatbase, {
        get(target, prop) {
          if (prop === 'q') {
            return target.q;
          }
          return (...args) => target(prop, ...args);
        }
      });
    }

    const injectScript = () => {
      const existing = document.getElementById(CHATBASE_SCRIPT_ID);
      if (existing) {
        return existing;
      }

      const script = document.createElement('script');
      script.src = 'https://www.chatbase.co/embed.min.js';
      script.id = CHATBASE_SCRIPT_ID;
      script.domain = 'www.chatbase.co';

      script.onerror = () => {
        console.error('Chatbase failed to load. Check network, browser privacy settings, or ad blocker.');
      };

      document.body.appendChild(script);
      return script;
    };

    const verifyIframe = () => {
      const iframeCount = document.querySelectorAll('iframe[src*="chatbase"]').length;
      if (iframeCount > 0 || retried) {
        return;
      }

      retried = true;
      const existing = document.getElementById(CHATBASE_SCRIPT_ID);
      if (existing) {
        existing.remove();
      }
      injectScript();
    };

    const onLoad = () => {
      injectScript();
      retryTimer = window.setTimeout(verifyIframe, 5000);
    };

    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }

    return () => {
      window.removeEventListener('load', onLoad);
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, []);

  return null;
}
