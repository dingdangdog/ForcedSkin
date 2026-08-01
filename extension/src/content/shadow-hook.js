(() => {
  const originalAttachShadow = Element.prototype.attachShadow;
  if (typeof originalAttachShadow !== "function" || originalAttachShadow.__gtsWrapped) return;

  function attachShadowWithNotification(init) {
    const root = originalAttachShadow.call(this, init);
    if (init?.mode === "open") {
      queueMicrotask(() => this.dispatchEvent(new CustomEvent("gts:shadow-attached")));
    }
    return root;
  }

  Object.defineProperty(attachShadowWithNotification, "__gtsWrapped", { value: true });
  Element.prototype.attachShadow = attachShadowWithNotification;
})();
