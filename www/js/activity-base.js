class ExplorerActivity {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.lang = app.lang;
    this.destroyed = false;
    this.timers = new Set();
  }

  later(fn, delay) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.destroyed) fn();
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  clearTimers() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  speak(text) {
    if (!this.destroyed) window.TTS?.speak(text, {
      lang: this.lang === 'vi' ? 'vi-VN' : 'en-US', rate: .9, pitch: 1,
    });
  }

  modelMarkup(name, label, extraAttributes = '') {
    const escape = value => String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
    return `<kid-model model="${escape(name)}" src="img/vocab/${escape(name)}.svg" aria-label="${escape(label)}" ${extraAttributes}><img class="model-fallback" src="img/vocab/${escape(name)}.svg" alt="" draggable="false"></kid-model>`;
  }

  prepareRender() {
    this.placementEvents?.abort();
    this.cancelDrag();
  }

  cancelDrag() {
    if (!this.drag) return;
    const { source, pointerId, ghost, target } = this.drag;
    source.classList.remove('activity-dragging');
    target?.classList.remove('activity-drop-hover');
    ghost?.remove();
    if (source.hasPointerCapture(pointerId)) source.releasePointerCapture(pointerId);
    this.drag = null;
  }

  createDragGhost(source) {
    const ghost = document.createElement('div');
    ghost.className = 'activity-drag-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = source.getAttribute('aria-label') || source.textContent.trim();
    return ghost;
  }

  bindDragDrop(sourceSelector, targetSelector, onDrop) {
    this.prepareRender();
    this.placementEvents = new AbortController();
    const { signal } = this.placementEvents;
    const findTarget = event => {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(targetSelector);
      return target && this.container.contains(target) && !target.disabled ? target : null;
    };
    this.container.addEventListener('dragstart', event => event.preventDefault(), { signal });
    this.container.addEventListener('click', event => {
      if (performance.now() < (this.blockDragClickUntil || 0)) {
        this.blockDragClickUntil = 0;
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, { capture: true, signal });
    this.container.addEventListener('pointerdown', event => {
      this.blockDragClickUntil = 0;
      const source = event.target.closest(sourceSelector);
      if (this.destroyed || this.drag || event.button !== 0 || !event.isPrimary ||
          !source || !this.container.contains(source) || source.disabled) return;
      this.drag = { source, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      source.setPointerCapture(event.pointerId);
    }, { signal });
    document.addEventListener('pointermove', event => {
      const drag = this.drag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (!drag.ghost && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
      event.preventDefault();
      if (!drag.ghost) {
        drag.ghost = this.createDragGhost(drag.source);
        document.body.append(drag.ghost);
        drag.source.classList.add('activity-dragging');
      }
      drag.ghost.style.left = `${event.clientX}px`;
      drag.ghost.style.top = `${event.clientY}px`;
      drag.target?.classList.remove('activity-drop-hover');
      drag.target = findTarget(event);
      drag.target?.classList.add('activity-drop-hover');
    }, { passive: false, signal });
    document.addEventListener('pointerup', event => {
      const drag = this.drag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const target = findTarget(event);
      const moved = Boolean(drag.ghost);
      const sourceId = drag.source.dataset.dragId;
      const targetId = target?.dataset.dropId;
      if (moved) {
        event.preventDefault();
        this.blockDragClickUntil = performance.now() + 400;
      }
      this.cancelDrag();
      if (moved && targetId !== undefined && !this.destroyed) onDrop(sourceId, targetId);
    }, { signal });
    document.addEventListener('pointercancel', event => {
      if (event.pointerId === this.drag?.pointerId) this.cancelDrag();
    }, { signal });
  }

  destroy() {
    this.destroyed = true;
    this.clearTimers();
    this.prepareRender();
    window.TTS?.cancel();
    this.container.innerHTML = '';
  }
}
