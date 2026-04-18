(function () {
  "use strict";

  var NEXON_BASE = window.NexonWidgetBase || "";
  var businessId = window.NexonBusinessId;
  if (!businessId) {
    console.warn("[Nexon Widget] window.NexonBusinessId is not set.");
    return;
  }

  // Inject styles
  var style = document.createElement("style");
  style.textContent = [
    "#nexon-widget-btn{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:#111;color:#fff;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .15s,box-shadow .15s}",
    "#nexon-widget-btn:hover{transform:scale(1.07);box-shadow:0 6px 20px rgba(0,0,0,.3)}",
    "#nexon-widget-frame{position:fixed;bottom:90px;right:24px;z-index:99998;width:360px;height:520px;border:none;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18);display:none;transition:opacity .2s,transform .2s;opacity:0;transform:translateY(12px) scale(.97)}",
    "#nexon-widget-frame.open{display:block;opacity:1;transform:translateY(0) scale(1)}",
    "@media(max-width:440px){#nexon-widget-frame{width:calc(100vw - 16px);right:8px;height:70vh}}",
  ].join("");
  document.head.appendChild(style);

  // Bubble button
  var btn = document.createElement("button");
  btn.id = "nexon-widget-btn";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML = '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>';
  document.body.appendChild(btn);

  // iframe
  var frame = document.createElement("iframe");
  frame.id = "nexon-widget-frame";
  frame.title = "Nexon Chat";
  frame.allow = "clipboard-write";
  var src = NEXON_BASE + "/widget/" + businessId;
  document.body.appendChild(frame);

  var open = false;
  btn.addEventListener("click", function () {
    open = !open;
    if (open) {
      if (!frame.src) frame.src = src;
      frame.classList.add("open");
      btn.setAttribute("aria-label", "Close chat");
      btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
    } else {
      frame.classList.remove("open");
      btn.setAttribute("aria-label", "Open chat");
      btn.innerHTML = '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>';
    }
  });
})();
