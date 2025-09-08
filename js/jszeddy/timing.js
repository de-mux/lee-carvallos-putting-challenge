var running=false;
var working=false;
var fskip=1; /* was 5 */
var fcounter=fskip;
var tframe=64168;
var cframe=100;
var handle;

function requestInterval(fn,delay) {

	var handle = new Object();
	var rtime = 0;

	handle.value = true;

	function loop() {
		var current;

	        while (true) {
		  fn.call();
	          current = new Date().getTime();
		  if (rtime==0) rtime = current+delay; else rtime += delay;
	          delta = rtime-current;
	          if (delta>0) break;
		  if (delta<-delay*5) {
		    delta = 0;
		    break;
		  }
		}

		if (handle.value) setTimeout(loop,delta);
	};
	
	setTimeout(loop,delay);
	return handle;
}

function clearRequestInterval(handle) {
	handle.value = false;
}

function start(){
if(running)stop();
canvas.focus();
running=true;
if (document.getElementById('fskip')!=undefined) fskip=parseInt(document.getElementById('fskip').value);
if (document.getElementById('opacity')!=undefined) bopacity=parseInt(document.getElementById('opacity').value);
handle=requestInterval(frame,delay);
console.log('Started');
cold=false;
}

function stop(){
silence();
if(!running)return;
running=false;
clearRequestInterval(handle);
console.log('Stopped');
}

function frame(){
if(!running||working)return;
working=true;
cframe=500;
fcounter--;
do{
event_next_event=tframe;
tstates=0;
z80_do_opcodes();
cframe--;
}while((nmigen||ipxl>0)&&cframe>0);
if(fcounter==0){
show();
paintScreen();
document.getElementById('screen').style.borderColor=bordercolor;
fcounter=fskip;
}
kcounter++;
if(cevt&&kcounter==2&&!(keyc.row==0&&keyc.mask==0x01)){
keyStates[keyc.row]=keyStates[0]=0xff;
cevt=false;
}
if(fskip<1)fskip=5;
if(cframe==0){stop();console.log('Crashed');}
if (tsw.isBrowserSupported) { psgA.envelope(); psgB.envelope(); psgC.envelope(); }
working=false;
}
