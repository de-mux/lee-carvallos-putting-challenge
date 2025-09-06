function load_p(buf,filnam){
var ramtop;
for(var i=0x0000;i<buf.length;i++){
memory[i+prgptr]=buf[i];
}
if(cold){
z80_reset();
z80.im=1;
z80.sp=0x7ffc;
memory[0x4002]=0xfc;
memory[0x4003]=0x7f;
memory[0x4004]=0x00;
memory[0x4005]=0x80;
}else{
ramtop=(memory[0x4005]<<8)|memory[0x4004];
z80.sp=ramtop-4;
memory[0x4002]=z80.sp&0x00ff;
memory[0x4003]=(z80.sp&0xff00)>>8;
}
memory[0x4000]=0xff;
memory[0x4001]=0x80;
memory[0x4006]=0x00;
memory[0x4007]=0xfe;
memory[0x4008]=0xff;
memory[z80.sp]=0x76;
memory[z80.sp+1]=0x06;
memory[z80.sp+2]=0x00;
memory[z80.sp+3]=0x3e;
z80.pc=0x0207;
z80.ixh=0x02;
z80.ixl=0x81;
z80.iyh=0x40;
z80.iyl=0x00;
z80.i=0x1e;
z80.r=0xca;
hsygen=nmigen=false;
liney=-1;
start();
}

function load_o(buf,filnam){
stop();
for(var i=0x0000;i<buf.length;i++){
memory[0x4000+i]=buf[i];
}
z80.pc=0x0283;
z80.sp=0x7fff;
memory[z80.sp]=0x3f;
hsygen=nmigen=false;
liney=-1;
start();
}

function load_bas(buf) {
    var line='', s='';
    var ok=false;
    var err=0;
    if (cold) {status('Start emulator first'); return;}
    for (var i=0; i<buf.length; i++) {
      if (buf[i]==10 || buf[i]==13) {
        if (ok) {
	  ok = false;
	  line += s;
	  if (line[line.length-1]=='\\') {
	    line = line.slice(0,line.length-1);
	  } else {
	    if (line[0]!='#') err = compile('0'+line);
	    line = '';
	    s = '';
	    if (err==1) break;
	  }
        }
      } else {
        s += String.fromCharCode(buf[i]);
	ok = true;
      }
    }
    if (ok) { if (line[0]!='#') err = compile('0'+line+s); }
    if (memory[0x4000]==0xff || memory[0x4000]==4) status('Done'); else status('Syntax error');
}

function load_txt(buf) {
    var lineno = 1;
    var lbuf=[0xea], ibuf=1;
    var ok=false;
    if (cold) {status('Start emulator first'); return;}
    for (var i=0; i<buf.length; i++) {
      if (buf[i]==10 || buf[i]==13) {
        if (ok) {
	  enter_line(lineno++,lbuf);
	  lbuf = [0xea];
	  ibuf = 1;
	  ok = false;
	}
      } else {
	lbuf[ibuf++] = ascii2zxcs[buf[i]&0x7f];
	ok = true;
      }
    }
    if (ok) enter_line(lineno,lbuf);
}

function load_bin(buf) {
    var lbuf=[0xea], ibuf;
    if (prgptr == 0x4009) {
      if (cold) {status('Start emulator first'); return;}
      ibuf = 1;
      for (var i=0; i<buf.length; i++) lbuf[ibuf++] = buf[i];
      enter_line(0,lbuf);
    } else {
      ibuf = prgptr;
      for (var i=0; i<buf.length; i++) memory[ibuf++] = buf[i]&0xff;
    }
}

function load_bmp(buf) {
    if (!hasImageData) return;
    var i, j, b, k, msk;
    var id = ctxb.getImageData(0,0,256,192);
    j = buf.length;
    i = 1024;
    while (true) {
      b = buf[--j];
      msk = 0x01
      for (k=1; k<=8; k++) {
	px = b&msk ? 255 : 0;
	msk <<= 1;
	--i;
        id.data[--i] = px;
        id.data[--i] = px;
        id.data[--i] = px;
      }
      if (!(i&1023)) i+=2048;
      if (i>196608) break;
    }
    ctxb.putImageData(id, 0, 0);
    status('Background image loaded');
}

function getgdb(buf,ptr,blen)
{
	var s='', t='[';
	var i;

	s += ' NM';
	for (i=ptr+88;;i++) {
	  s += zx2ascii[buf[i]&0x3f];
	  if (buf[i]&0x80) break;
	}

	for (i++; i<ptr+blen; i++) t += hex2(buf[i]);
        t += ']';

        if (document.getElementById('cassette')!=undefined) document.getElementById('cassette').value += t;

	return s;
}

function load_tzx(buf) {
	var ptr=0;
	var parsing=true;
	var state=0;
	var c, blen;
	var cnt=0;
	var s='';

	document.getElementById('cassette').value = s;

	while (parsing) {
	  if (ptr>=buf.length) break;
	  c = buf[ptr++];
	  switch (state) {
	    case 0    : if (c==26) { state++; break; }
		        s += String.fromCharCode(c);
		        break;
	    case 1    : s += ' Version:' + c.toString() + '.';
		        c = buf[ptr++];
		        s += c.toString();
		        state++;
		        break;
	    case 2    : s += ' ID' + c.toString();
			state = c;
		        break;
	    case 0x19 : blen = c;
		        c = buf[ptr++];
			blen = (c<<8) | blen;
			s += ' LN' + blen.toString();
		        c = buf[ptr++];
		        c = buf[ptr++];
			s += getgdb(buf,ptr,blen);
			ptr += blen;
			state = 2;
			break;
	    case 0x30 : if (cnt==0) {
		          cnt = c;
		          s += ' LN' + cnt.toString();
		        } else {
		          s += String.fromCharCode(c);
		          cnt--;
		          if (cnt==0) state = 2;
		        }
		        break;
	    default   : parsing = false;
	  }
	}
	start(s);
	status(s);
}

function load_hex(buf,filnam) {
	var cbuf=[], b, j=0;
	for (var i=0; i<buf.length;) {
	  c = buf[i++];
	  if (c!=10 && c!=13) {
	    if (c<=57) b = 16*(c-48); else b = 16*(c-87);
	    c = buf[i++];
	    if (c<=57) b += (c-48); else b += (c-87);
	    cbuf[j++] = b;
          }
	}
        load_p(cbuf,filnam);
}

function handle_file(name,bv) {
var ext=name.split('.').pop().toLowerCase();
if(ext=='p'||ext=='81') {
load_p(bv,name);
arx=(name.indexOf('arx')>=0);
save_n(name);
status('File loaded');
}else if(ext=='o'||ext=='80') {
load_o(bv,name);
save_n(name);
status('File loaded');
}else if(ext=='tzx'){
load_tzx(bv);
}else if(ext=='hex'){
load_hex(bv,name);
save_n(name);
status('File loaded');
}else if(ext=='rom'||ext=='bin'||ext=='stc'){
load_bin(bv);
return 1;
}else if(ext=='pt3'){
if (prgptr==0x4009) {
expanded=true;
document.getElementById('memory').value='56K';
prgptr=0x8000;
load_bin(bv);
prgptr=0x4009;
get_file('p/pt3pl.p')
} else {
load_bin(bv);
}
}else if(ext=='bas'){
load_bas(bv);
return 1;
}else if(ext=='bmp'){
load_bmp(bv);
}else{
load_txt(bv);
return 1;
}
return 0;
}

function get_file(filnam){
var req=new XMLHttpRequest();
req.open('GET',filnam,false);
if(req.overrideMimeType)
req.overrideMimeType('text/plain;charset=x-user-defined');
req.send(null);
if(req.status==200 || req.status==0){
var bv = new Uint8Array(req.responseText.length);
for (var i=0; i<req.responseText.length; i++)
bv[i] = req.responseText.charCodeAt(i);
handle_file(filnam,bv);
}else{
status('GET failed');
}
prgptr = 0x4009;
}
