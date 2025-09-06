var cevt=false;
var kcounter=0;
var keyStates = [];
var keyc;

function kybd_init() {
	document.onkeydown = keyDown;
	document.onkeyup = keyUp;
	for (var row = 0; row < 9; row++) {
		keyStates[row] = 0xff;
	}
}

var keyCodes = {
	49: {row: 3, mask: 0x01}, /* 1 */
	50: {row: 3, mask: 0x02}, /* 2 */
	51: {row: 3, mask: 0x04}, /* 3 */
	52: {row: 3, mask: 0x08}, /* 4 */
	53: {row: 3, mask: 0x10}, /* 5 */
	54: {row: 4, mask: 0x10}, /* 6 */
	55: {row: 4, mask: 0x08}, /* 7 */
	56: {row: 4, mask: 0x04}, /* 8 */
	57: {row: 4, mask: 0x02}, /* 9 */
	48: {row: 4, mask: 0x01}, /* 0 */

	81: {row: 2, mask: 0x01}, /* Q */
	87: {row: 2, mask: 0x02}, /* W */
	69: {row: 2, mask: 0x04}, /* E */
	82: {row: 2, mask: 0x08}, /* R */
	84: {row: 2, mask: 0x10}, /* T */
	89: {row: 5, mask: 0x10}, /* Y */
	85: {row: 5, mask: 0x08}, /* U */
	73: {row: 5, mask: 0x04}, /* I */
	79: {row: 5, mask: 0x02}, /* O */
	80: {row: 5, mask: 0x01}, /* P */

	65: {row: 1, mask: 0x01}, /* A */
	83: {row: 1, mask: 0x02}, /* S */
	68: {row: 1, mask: 0x04}, /* D */
	70: {row: 1, mask: 0x08}, /* F */
	71: {row: 1, mask: 0x10}, /* G */
	72: {row: 6, mask: 0x10}, /* H */
	74: {row: 6, mask: 0x08}, /* J */
	75: {row: 6, mask: 0x04}, /* K */
	76: {row: 6, mask: 0x02}, /* L */
	13: {row: 6, mask: 0x01}, /* enter */

	16: {row: 0, mask: 0x01}, /* caps */
	192: {row: 0, mask: 0x01}, /* backtick as caps - because firefox screws up a load of key codes when pressing shift */
	90: {row: 0, mask: 0x02}, /* Z */
	88: {row: 0, mask: 0x04}, /* X */
	67: {row: 0, mask: 0x08}, /* C */
	86: {row: 0, mask: 0x10}, /* V */
	66: {row: 7, mask: 0x10}, /* B */
	78: {row: 7, mask: 0x08}, /* N */
	77: {row: 7, mask: 0x04}, /* M */
	190: {row: 7, mask: 0x02}, /* . */
	32: {row: 7, mask: 0x01}, /* space */

	8: {row: 8, mask: 0x01}, /* rubout */
	46: {row: 8, mask: 0x01}, /* rubout */
	188: {row: 8, mask: 0x02}, /* , */
	59: {row: 8, mask: 0x03}, /* ; */
	173: {row: 8, mask: 0x04}, /* - */
	61: {row: 8, mask: 0x05}, /* = */
	191: {row: 8, mask: 0x06} /* / */
};

function getKeyCode(code) {
         if (document.getElementById('arrows')!=undefined) {
	   var arrows = document.getElementById('arrows').value;
	 } else {
	   arrows = '7568';
	 }
	 switch (code) {
	   case 38 : code = arrows.charCodeAt(0); break; /* W */
	   case 37 : code = arrows.charCodeAt(1); break; /* A */
	   case 40 : code = arrows.charCodeAt(2); break; /* S */
	   case 39 : code = arrows.charCodeAt(3); break; /* D */
	   default : ;
	 }
	 return keyCodes[code];
}

function keyDown(evt) {
        var ae = document.activeElement.id;
	if (ae!='screen') return;
	var keyCode = getKeyCode(evt.keyCode);
	if (keyCode == null) return;

        if (zonx && tsw.isBrowserSupported) {
	  psgB.oscfreq(256+16*evt.keyCode);
	  psgB.beep(0.5);
	}

	if (keyCode.row==8) {
	   switch (keyCode.mask) {
	     case 0x01 : keyStates[0] &= ~0x01; keyStates[4] &= ~0x01; break;
	     case 0x02 : keyStates[0] &= ~0x01; keyStates[7] &= ~0x02; break;
	     case 0x03 : keyStates[0] &= ~0x01; keyStates[0] &= ~0x04; break;
	     case 0x04 : keyStates[0] &= ~0x01; keyStates[6] &= ~0x08; break;
	     case 0x05 : keyStates[0] &= ~0x01; keyStates[6] &= ~0x02; break;
	     case 0x06 : keyStates[0] &= ~0x01; keyStates[0] &= ~0x10; break;
	     default   : ;
	   }
	} else {
	  keyStates[keyCode.row] &= ~(keyCode.mask);
	}
	evt.preventDefault();
}
function keyUp(evt) {
        var ae = document.activeElement.id;
	if (ae!='screen') return;
	var keyCode = getKeyCode(evt.keyCode);
	if (keyCode == null) return;
	if (keyCode.row==8) {
	   switch (keyCode.mask) {
	     case 0x01 : keyStates[0] |= 0x01; keyStates[4] |= 0x01; break;
	     case 0x02 : keyStates[0] |= 0x01; keyStates[7] |= 0x02; break;
	     case 0x03 : keyStates[0] |= 0x01; keyStates[0] |= 0x04; break;
	     case 0x04 : keyStates[0] |= 0x01; keyStates[6] |= 0x08; break;
	     case 0x05 : keyStates[0] |= 0x01; keyStates[6] |= 0x02; break;
	     case 0x06 : keyStates[0] |= 0x01; keyStates[0] |= 0x10; break;
	     default   : ;
	   }
	} else {
	  keyStates[keyCode.row] |= keyCode.mask;
	}
	evt.preventDefault();
}

function pointit(event,resized){
if (!running){start();return}

// -- new code
// Steven Reid - my version of getting position based on size of canvas
var elem = document.getElementById("screen"); // assumes canvas is screen
// real size of canvas
var w = elem.clientWidth;
var h = elem.clientHeight;
// espected size of canvase
var ow = 256;
var oh = 192;
// okay, I need to rationalize the width/height so I know how to scale offsetX & Y
var pw = ow/w;
var ph = oh/h;    

// calculate postion
pos_x = parseInt(event.offsetX * pw);
pos_y = parseInt(event.offsetY * ph);
  
//debugging...
//var coor = "X coords: " + pos_x + "." + w +
//  ", Y coords: " + pos_y + "." + h;
// document.getElementById("demo").innerHTML = coor;
// console.log(coor);
// -- end new code
// -- original code
//pos_x=(event.offsetX)?event.offsetX:event.layerX;
//pos_y=(event.offsetY)?event.offsetY:event.layerY;
// border?
//if (pos_x<32 || pos_x>=544 || pos_y<32 || pos_y>=416) return;
// remove if image at original size without border
//if (resized) {
//  pos_x=(pos_x-32)/2;
//  pos_y=(pos_y-32)/2;
//}
// -- end original code  

canvas.focus();
keyc=null;
if(pos_y<=45){
if(pos_x<=23)keyc=keyCodes[49];
else if(pos_x<=46)keyc=keyCodes[50];
else if(pos_x<=70)keyc=keyCodes[51];
else if(pos_x<=96)keyc=keyCodes[52];
else if(pos_x<=118)keyc=keyCodes[53];
else if(pos_x<=143)keyc=keyCodes[54];
else if(pos_x<=166)keyc=keyCodes[55];
else if(pos_x<=191)keyc=keyCodes[56];
else if(pos_x<=215)keyc=keyCodes[57];
else keyc=keyCodes[48];
}else if(pos_y<=90){
if(pos_x<=34)keyc=keyCodes[81];
else if(pos_x<=58)keyc=keyCodes[87];
else if(pos_x<=82)keyc=keyCodes[69];
else if(pos_x<=106)keyc=keyCodes[82];
else if(pos_x<=131)keyc=keyCodes[84];
else if(pos_x<=154)keyc=keyCodes[89];
else if(pos_x<=179)keyc=keyCodes[85];
else if(pos_x<=201)keyc=keyCodes[73];
else if(pos_x<=226)keyc=keyCodes[79];
else keyc=keyCodes[80];
}else if(pos_y<=135){
if(pos_x<=41)keyc=keyCodes[65];
else if(pos_x<=65)keyc=keyCodes[83];
else if(pos_x<=88)keyc=keyCodes[68];
else if(pos_x<=113)keyc=keyCodes[70];
else if(pos_x<=136)keyc=keyCodes[71];
else if(pos_x<=160)keyc=keyCodes[72];
else if(pos_x<=185)keyc=keyCodes[74];
else if(pos_x<=208)keyc=keyCodes[75];
else if(pos_x<=233)keyc=keyCodes[76];
else keyc=keyCodes[13];
}else{
if(pos_x<=30)keyc=keyCodes[16];
else if(pos_x<=54)keyc=keyCodes[90];
else if(pos_x<=78)keyc=keyCodes[88];
else if(pos_x<=102)keyc=keyCodes[67];
else if(pos_x<=127)keyc=keyCodes[86];
else if(pos_x<=150)keyc=keyCodes[66];
else if(pos_x<=173)keyc=keyCodes[78];
else if(pos_x<=198)keyc=keyCodes[77];
else if(pos_x<=222)keyc=keyCodes[190];
else keyc=keyCodes[32];
}
if(keyc==null)return;
keyStates[keyc.row]&=~(keyc.mask);
cevt=true;
kcounter=0;
}
