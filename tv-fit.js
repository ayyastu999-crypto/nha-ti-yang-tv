// Fit the 16:9 TV layout to small browser viewports.
// Android TV browsers often report 960×540 CSS px (or less, minus their toolbar), where the layout would
// need scrolling. Below 1280×720 in landscape, the app runs inside a frame that is laid out at a full
// design size (720 px tall, as wide as the screen's aspect needs, at least 1280) and scaled down to fit,
// so media queries and vw/vh units see the design size and everything keeps its proportions.
// Runs before app.js; window.__tvFit tells app.js to leave this outer page idle.
(function () {
  if (window.top !== window) return;
  // Cache the app's files so the next load (the TV reopening Home) does not wait for the network.
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  var DESIGN_W = 1280, DESIGN_H = 720;
  function needsFit() {
    return innerWidth > innerHeight && (innerWidth < DESIGN_W || innerHeight < DESIGN_H);
  }
  if (!needsFit()) return;
  window.__tvFit = true;
  document.documentElement.classList.add('tv-fit');
  var style = document.createElement('style');
  style.textContent = 'html.tv-fit,html.tv-fit body{margin:0;overflow:hidden;background:#05070b}' +
    'html.tv-fit body>*:not(#tv-fit-frame){display:none!important}' +
    '#tv-fit-frame{position:fixed;left:0;top:0;border:0;transform-origin:0 0;background:#05070b}';
  document.head.appendChild(style);

  function layout(frame) {
    var w = innerWidth, h = innerHeight;
    var designH = Math.max(DESIGN_H, Math.round(DESIGN_W * h / w));
    var designW = Math.round(designH * w / h);
    var scale = w / designW;
    frame.style.width = designW + 'px';
    frame.style.height = designH + 'px';
    frame.style.transform = 'scale(' + scale + ')';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var frame = document.createElement('iframe');
    frame.id = 'tv-fit-frame';
    frame.title = document.title;
    frame.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
    frame.setAttribute('allowfullscreen', '');
    frame.src = location.pathname + location.search + location.hash;
    layout(frame);
    document.body.appendChild(frame);
    // Remote keys go to whichever document has focus: hand it to the frame.
    frame.addEventListener('load', function () { frame.focus(); try { frame.contentWindow.focus(); } catch (e) {} });
    addEventListener('resize', function () { layout(frame); });
    addEventListener('focus', function () { frame.focus(); });
  });
})();
