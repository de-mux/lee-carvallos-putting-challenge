// function status(s){}
function show() { }

function go(pfile) {
  var req = new XMLHttpRequest();
  req.open("GET", "/js/jszeddy/rom/zx81.rom", true);
  if (req.overrideMimeType)
    req.overrideMimeType("text/plain;charset=x-user-defined");
  req.send(null);
  if (req.responseText) {
    console.log("ROM loaded, size: " + req.responseText.length);
    roms["zx81.rom"] = req.responseText;
  } else {
    console.warn("Warning: ROM file is empty or failed to load.");
  }
  z80_init();
  zx81_init();
  // fskip=1; // possible override
  if (pfile != undefined) get_file(pfile);
  // start(); // if desired
  if (tsw.isBrowserSupported) startPSGs();
}
