(function () {
  const CHATBASE_SCRIPT_ID = 'mLWHSR9cJu1GCTV_uI-0n';

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
      },
    });
  }

  const onLoad = function () {
    if (document.getElementById(CHATBASE_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.chatbase.co/embed.min.js';
    script.id = CHATBASE_SCRIPT_ID;
    script.domain = 'www.chatbase.co';
    document.body.appendChild(script);
  };

  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad);
  }
})();
