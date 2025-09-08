// function status(s){}
function show() { }

function go(pfile) {
  var req = new XMLHttpRequest();
  req.open("GET", "/js/jszeddy/rom/zx81.rom", true);
  req.responseType = "arraybuffer";
  req.onload = function() {
    if (req.status === 200) {
      var arrayBuffer = req.response;

      if (arrayBuffer) {
        console.log(
          "ZX81 ROM loaded, size: " + arrayBuffer.byteLength + " bytes",
        );
        var romData = new Uint8Array(arrayBuffer);
        roms["zx81.rom"] = romData;
        z80_init();
        zx81_init();
        // fskip=1; // possible override
        if (pfile != undefined) get_file(pfile);
        // start(); // if desired
        if (tsw.isBrowserSupported) startPSGs();
      } else {
        console.warn("Warning: ROM file is empty or failed to load.");
      }
    } else {
      console.error("Error loading ROM. Status: " + req.status);
    }
  };

  req.onerror = function() {
    console.error("Network error while trying to load ROM.");
  };

  req.send(null);
}
