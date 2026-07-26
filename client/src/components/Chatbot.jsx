import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Chatbot() {
  const location = useLocation();

  useEffect(() => {
    // Do not render on login or signup
    if (location.pathname === '/login' || location.pathname === '/signup') return;

    // create floating widget container
    const widget = document.createElement('div');
    widget.id = 'react-ai-widget-root';
    widget.style.position = 'fixed';
    widget.style.bottom = '25px';
    widget.style.right = '25px';
    widget.style.zIndex = '9999';

    // toggle button
    const btn = document.createElement('button');
    btn.id = 'aiToggleButtonReact';
    btn.textContent = 'AI';
    Object.assign(btn.style, {
      backgroundColor: '#22b8ff',
      color: 'white',
      border: 'none',
      padding: '12px 14px',
      borderRadius: '24px',
      cursor: 'pointer'
    });

    // chat box container
    const box = document.createElement('div');
    box.id = 'aiChatBoxReact';
    Object.assign(box.style, {
      display: 'none',
      position: 'fixed',
      bottom: '85px',
      right: '25px',
      width: '330px',
      height: '430px',
      backgroundColor: '#111827',
      color: 'white',
      border: '1px solid #2d3748',
      borderRadius: '12px',
      overflow: 'hidden',
      zIndex: '10000',
      boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
    });

    btn.onclick = () => {
      box.style.display = box.style.display === 'block' ? 'none' : 'block';
    };

    widget.appendChild(btn);
    widget.appendChild(box);
    document.body.appendChild(widget);

    // Initialize n8n chat module
    let cancelled = false;
    (async () => {
      try {
        const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
        if (cancelled) return;
        if (module && module.createChat) {
          module.createChat({
            webhookUrl: 'https://n8ngc.codeblazar.org/webhook/7a06a102-41d2-4040-bf21-f864a122b53a/chat'
          });
        }
      } catch (e) {
        // ignore
        // console.error('Failed to init n8n chat', e);
      }
    })();

    return () => {
      cancelled = true;
      try { document.body.removeChild(widget); } catch (e) {}
    };
  }, [location.pathname]);

  return null;
}
