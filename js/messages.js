(function (Drupal, once, drupalSettings) {
  'use strict';
  const selector = '[data-drupal-messages] .alert, [data-drupal-messages] .messages, [data-drupal-message-type], .messages[data-nex-message]';
  const active = new Map();
  const metadataSelector = '[data-nex-timeout], [data-nex-message]';
  const valid = (value) => value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
  function timeoutFor(message) {
    const policy = drupalSettings.nexMessage || {};
    const type = message.dataset.drupalMessageType || (message.matches('.alert-danger, .alert-error, .messages--error') ? 'error' : message.matches('.alert-warning, .messages--warning') ? 'warning' : message.matches('.alert-status, .alert-success, .messages--status') ? 'status' : 'unknown');
    const fallback = (policy.timeouts || {})[type];
    let seconds = valid(fallback) ? Number(fallback) : 0;
    const entries = [...message.querySelectorAll(metadataSelector)];
    if (message.matches(metadataSelector)) entries.unshift(message);
    const overrides = entries.map((entry) => {
      const explicit = entry.getAttribute('data-nex-timeout');
      const named = (policy.overrides || {})[entry.dataset.nexMessage];
      return valid(explicit) ? Number(explicit) : valid(named) ? Number(named) : null;
    }).filter((value) => value !== null);
    // Any persistent message keeps a grouped message container visible.
    if (overrides.includes(0)) return 0;
    if (overrides.length) seconds = Math.max(...overrides);
    return seconds;
  }
  function stop(message) {
    const state = active.get(message);
    if (!state) return;
    clearInterval(state.timer);
    clearTimeout(state.fade);
    state.cleanup();
    active.delete(message);
  }
  Drupal.behaviors.nexMessage = {
    attach(context) {
      const candidates = [...context.querySelectorAll(selector)];
      if (context.matches && context.matches(selector)) candidates.unshift(context);
      once('nex-message', candidates).forEach((message) => {
        // Only manage the outer message, never a nested metadata wrapper.
        if (message.parentElement && message.parentElement.closest(selector)) return;
        const seconds = timeoutFor(message);
        if (!seconds) return;
        const controls = document.createElement('div');
        controls.className = 'nex-message-controls';
        // Updating countdowns must not repeatedly interrupt screen readers.
        controls.setAttribute('aria-live', 'off');
        const label = document.createElement('span');
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'nex-message-close-now';
        close.textContent = Drupal.t('Close now');
        close.addEventListener('click', () => {
          stop(message);
          message.remove();
        });
        const keep = document.createElement('button');
        keep.type = 'button';
        keep.textContent = Drupal.t('Keep open');
        controls.append(label, close, keep);
        const content = message.querySelector('.messages__content');
        (content || message).append(controls);
        let remaining = seconds * 1000;
        let last = performance.now();
        const paused = () => document.hidden || message.matches(':hover, :focus-within');
        const display = () => {
          label.textContent = paused() ? Drupal.t('Countdown paused') : Drupal.t('Closes in @seconds seconds', { '@seconds': Math.ceil(remaining / 1000) });
        };
        const resumeReading = () => {
          last = performance.now();
          const state = active.get(message);
          if (state && state.fade) {
            clearTimeout(state.fade);
            state.fade = null;
            remaining = seconds * 1000;
            message.classList.remove('nex-message-fading');
          }
          display();
        };
        const events = ['mouseenter', 'mouseleave', 'focusin', 'focusout'];
        events.forEach((event) => message.addEventListener(event, resumeReading));
        document.addEventListener('visibilitychange', resumeReading);
        const state = { timer: null, fade: null, cleanup() {
          events.forEach((event) => message.removeEventListener(event, resumeReading));
          document.removeEventListener('visibilitychange', resumeReading);
        } };
        active.set(message, state);
        keep.addEventListener('click', () => {
          stop(message);
          message.classList.remove('nex-message-fading');
          label.textContent = Drupal.t('This message will stay open');
          keep.remove();
        });
        display();
        state.timer = setInterval(() => {
          if (!message.isConnected) { stop(message); return; }
          const now = performance.now();
          if (!paused() && !state.fade) remaining -= now - last;
          last = now;
          display();
          if (remaining > 0 || paused() || state.fade) return;
          message.classList.add('nex-message-fading');
          state.fade = setTimeout(() => {
            if (paused()) { resumeReading(); return; }
            stop(message);
            message.remove();
          }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400);
        }, 200);
      });
    },
    detach(context, settings, trigger) {
      if (trigger !== 'unload') return;
      for (const message of active.keys()) {
        if (context === message || context.contains(message)) stop(message);
      }
    }
  };
})(Drupal, once, drupalSettings);
