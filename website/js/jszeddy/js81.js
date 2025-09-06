// function status(s){}
function show(){}

function go(pfile){
var req=new XMLHttpRequest();
req.open('GET','/js/jszeddy/rom/zx81.rom',true);
if(req.overrideMimeType)
req.overrideMimeType('text/plain;charset=x-user-defined');
req.send(null);
roms['zx81.rom']=req.responseText;
z80_init();
zx81_init();
// fskip=1; // possible override
if (pfile!=undefined) get_file(pfile);
// start(); // if desired
if (tsw.isBrowserSupported) startPSGs();
}
