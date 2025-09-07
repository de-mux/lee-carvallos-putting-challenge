var prgptr = 0x4009;
var roms = {};
var memory = [];
var font = [];
var fontqs = [];
var memhrg = [];
var canvas;
var ctx, ctxb, background;
var imageData;
var imageDataData;
var hasImageData;
var cold = true;
var expanded = true;
var zx80 = false;
var bopacity = 248,
  opacity = bopacity;
//var bopacity=200,opacity=bopacity;
var chromamode = true;
var hrgrom = 0;
var mtmode = 0;
var brkaddr = 0x10000;
var tstates = 0;
var event_next_event;
var delay = 20;
var cptr = 0;
var nmigen = false,
  hsygen = false;
var hires = false;
var rstart = 0,
  grstart = false;
var speed = 1;
var lfout = 1;
scnt = 0;
prbuf = "";
var cscheme = 0;
var zxregA = 0,
  zxregsA = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var psgA, psgB, psgC;
var evo;
var zonx = false;
var arx = false;
var bordercolor = "white";

var zx2ascii =
  ' __________"!$:?()><=+-*/;,.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var ascii2zx = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 12, 11, 12, 13, 0, 0, 11, 16, 17, 23, 21, 26, 22, 27, 24,
  28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 14, 25, 19, 20, 18, 15, 23, 38, 39,
  40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58,
  59, 60, 61, 62, 63, 16, 24, 17, 11, 22, 11, 38, 39, 40, 41, 42, 43, 44, 45,
  46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 16,
  24, 17, 11, 0,
];

var ascii2zxcs = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x76, 0, 0, 0x76, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 11, 12, 13, 0, 0xda, 11, 16, 17, 23, 21, 26,
  22, 27, 24, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 14, 25, 19, 20, 18, 15,
  23, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180,
  181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 16, 24, 17, 11, 22, 11,
  38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
  57, 58, 59, 60, 61, 62, 63, 16, 24, 17, 11, 0,
];

function run_ret(pc) {
  memory[--z80.sp] = 0xff;
  memory[--z80.sp] = 0xff;
  z80.pc = pc;
  tstates = 0;
  event_next_event = tframe * 50;
  brkaddr--;
  z80_do_opcodes();
  brkaddr++;
  z80.pc = 0x02bb;
}

function line_addr(n) {
  z80.h = (n & 0xff00) >> 8;
  z80.l = n & 0x00ff;
  run_ret(0x09d8);
  return (z80.h << 8) | z80.l;
}

function enter_line(lineno, buf) {
  var i, n, nn, ptr, sptr;

  ptr = line_addr(lineno);

  // delete line if it exists
  if (z80.f & 0x40) {
    run_ret(0x09f2);
    run_ret(0x0a60);
  }

  n = buf.length;

  // make-room
  nn = n + 5;
  z80.b = (nn & 0xff00) >> 8;
  z80.c = nn & 0x00ff;
  ptr--;
  z80.h = (ptr & 0xff00) >> 8;
  z80.l = ptr & 0x00ff;
  run_ret(0x099e);
  ptr++;

  // copy line
  sptr = ptr + 4;
  memory[ptr++] = (lineno & 0xff00) >> 8;
  memory[ptr++] = lineno & 0x00ff;
  nn = n + 1;
  memory[ptr++] = nn & 0x00ff;
  memory[ptr++] = (nn & 0xff00) >> 8;
  for (i = 0; i < n; i++) memory[ptr++] = buf[i] & 0xff;
  memory[ptr] = 0x76;

  // syntax check, also for adding floating point numbers
  run_ret(0x14bc); /* set-mem */
  memory[0x4000] = 0xff; /* clear error */

  memory[0x4007] = lineno & 0x00ff;
  memory[0x4008] = (lineno & 0xff00) >> 8;

  memory[0x4001] &= ~0x80; /* syntax check */
  memory[0x4016] = sptr & 0x00ff;
  memory[0x4017] = (sptr & 0xff00) >> 8;

  // if inkey$ is being syntax checked, the keyboard call messes up
  memory[0x0fa1] = 0x21;
  memory[0x0fa2] = 0xff;
  memory[0x0fa3] = 0xff;
  run_ret(0x0cde); /* run */
  memory[0x0fa1] = 0xcd;
  memory[0x0fa2] = 0xbb;
  memory[0x0fa3] = 0x02;

  run_ret(0x14a3); /* x-temp */

  memory[0x4001] |= 0x80;
  if (memory[0x4000] != 0xff) {
    nmigen = true;
    return 1;
  }

  // adjust length
  n++;
  while (1) {
    c = memory[ptr];
    if (c == 0x7e) {
      n += 5;
      ptr += 5;
    }
    if (c == 0x76) break;
    n++;
    ptr++;
  }
  memory[sptr - 2] = n & 0x00ff;
  memory[sptr - 1] = (n & 0xff00) >> 8;

  return 0;
}

function finish() {
  run_ret(0x0a2a);
  // if call to SLOW/FAST during init is skipped
  // we'll go to FAST here... otherwise crash after code reporting
  if (memory[0x403b] & 0x80) memory[0x403b] |= 0x40;
  else memory[0x403b] &= ~0x40;
  z80.b = z80.c = 0;
  run_ret(0x0733);
  z80.a = 0;
  z80.pc = 0x06b5;
  z80.sp = 0x7ffc;
  if (memory[0x403b] & 0x80) nmigen = true;
}

function copy() {
  var ptr1 = (memory[0x400d] << 8) | memory[0x400c];
  var ptr2 = (memory[0x4011] << 8) | memory[0x4010];
  for (var ptr = ptr1 + 1; ptr < ptr2; ptr++) {
    z80.a = 0x76;
    ptr = lprint(ptr);
  }
}

function cname(ptr) {
  var s = "";
  var c;

  if (zx80) return "/ZX80PROG.O";

  if (ptr <= 0x8000) {
    // range check
    do {
      c = memory[ptr++];
      s += zx2ascii[c & 0x3f];
    } while (!(c & 0x80));
    s.toUpperCase();
  }

  return s;
}

function load_t(ptr) {
  var name = cname(ptr);
  var b, c, ptr;
  var s;
  var z80pc;
  if (name.length > 0) {
    if (name[0] == "/") {
      s = name.split(";");
      if (s.length > 1) {
        prgptr = parseInt(s.pop());
        name = s[0];
      }
      s = name.split(".");
      if (s.length == 1) {
        if (zx80) s = "o" + name + ".o";
        else s = "p" + name + ".p";
      } else {
        s = s.pop() + name;
      }
      s = s.toLowerCase();
      z80pc = z80.pc;
      if (s == "rom/memohrg.rom") {
        prgptr = 8192;
        hrgrom = -1;
      }
      if (s == "rom/g007hrg.rom") {
        for (var i = 0x0000; i < 0x2000; i++) {
          memory[i] = roms["zx81.rom"].charCodeAt(i) & 0xff;
        }
        prgptr = 10240;
        hrgrom = -2;
      }
      get_file(s);
      z80.pc = z80pc;
      if (hrgrom < 0) {
        hrgrom = -hrgrom;
        if (hrgrom == 2) reset();
      }
      return;
    } else {
      s = localStorage[name];
      if (!s) {
        console.log("Data not found: " + name);
        return;
      }
    }
  } else if (document.getElementById("cassette") != undefined) {
    s = document.getElementById("cassette").value;
    if (s.length == 0) {
      console.log("Data not found");
      return;
    }
  }

  ptr = prgptr;
  for (var i = cptr; i < s.length; i += 2) {
    if (s[i] == "[") i++;
    else if (s[i] == "]") {
      cptr = i + 1;
      break;
    }
    c = s.charCodeAt(i);
    if (c <= 57) b = 16 * (c - 48);
    else b = 16 * (c - 87);
    c = s.charCodeAt(i + 1);
    if (c <= 57) b += c - 48;
    else b += c - 87;
    memory[ptr++] = b;
  }

  if (cptr >= s.length) cptr = 0;

  console.log("Data loaded");
}

function save_t(ptr) {
  var name = cname(ptr);
  save_n(name);
}

function save_n(name) {
  var s = "";
  var eptr;
  var i, i1, i2;
  var t;

  if (zx80) return;

  eptr = (memory[0x4015] << 8) | memory[0x4014];
  for (var i = prgptr; i < eptr; i++) s += hex2(memory[i]);

  i1 = 0;
  i2 = name.length;
  for (i = name.length - 1; i >= 0; i--)
    if (name[i] == ".") i2 = i;
    else if (name[i] == "\\") {
      i1 = i + 1;
      break;
    }

  name = name.substring(i1, i2);
  name = name.toUpperCase();

  if (document.getElementById("cassette") != undefined) {
    document.getElementById("cassette").value = s;

    if (!localStorage[name]) {
      t = document.getElementById("cname").value;
      if (t == "") document.getElementById("cname").value = name;
      else document.getElementById("cname").value = t + ";" + name;

      localStorage["_DIR_"] = document.getElementById("cname").value;
    }
  }

  localStorage[name] = s;

  console.log("Data saved");
}

function lprint(ptr) {
  var i, c, cc;

  while (1) {
    c = memory[ptr];
    if (c == 0x76) break;
    cc = zx2ascii[c & 0x3f];
    if (cc == " ") {
      scnt++;
    } else {
      if (scnt) {
        for (i = 1; i <= scnt; i++) prbuf += " ";
        scnt = 0;
      }
      if (cc == "_" || c & 0x80) {
        prbuf += "#" + hex2(c);
      } else prbuf += cc;
    }
    ptr++;
  }
  if (z80.a == 0x76) {
    /* trick to avoid wrapping */
    p = document.getElementById("printer");
    p.value += prbuf + "\n";
    p.scrollTop = p.scrollHeight;
    prbuf = "";
    scnt = 0;
  }
  return ptr;
}

function zx81_init() {
  for (var i = 0x0000; i < 0x2000; i++) {
    memory[i] = roms["zx81.rom"][i];
  }
  memory[0x416] = memory[0x417] = memory[0x418] = 0;
  for (var i = 0x2000; i < 0x4000; i++) {
    memory[i] = 7;
  }
  for (var i = 0x4000; i < 0x10000; i++) {
    memory[i] = 0;
  }
  if (roms["lmbfnt.rom"] != undefined)
    for (var i = 0x0000; i < 0x0200; i++) {
      font[i] = roms["lmbfnt.rom"].charCodeAt(i) & 0xff;
    }
  for (var i = 0x0200; i < 0x0400; i++) {
    font[i] = 0;
  }

  memory[0x0347] = 0xeb; /* for load */
  memory[0x0348] = 0xed;
  memory[0x0349] = 0xfc;
  memory[0x034a] = 0xc3;
  memory[0x034b] = 0x07;
  memory[0x034c] = 0x02;

  memory[0x02fc] = 0xed; /* for save */
  memory[0x02fd] = 0xfd;
  memory[0x02fe] = 0xc3;
  memory[0x02ff] = 0x07;
  memory[0x0300] = 0x02;

  memory[0x0876] = 0xed; /* for lprint */
  memory[0x0877] = 0xfe;
  memory[0x0878] = 0xc3;
  memory[0x0879] = 0xe2;
  memory[0x087a] = 0x08;

  memory[0x0869] = 0xed; /* for copy */
  memory[0x086a] = 0xf5;
  memory[0x086b] = 0xc9;

  canvas = document.getElementById("sback");
  if (canvas != undefined) {
    ctxb = canvas.getContext("2d");
    background = new Image(256, 192);
    background.src = "zx81kybd.png";
    background.onload = function() {
      ctxb.drawImage(background, 0, 0);
    };
  }

  canvas = document.getElementById("screen");
  ctx = canvas.getContext("2d");
  canvas.setAttribute("tabindex", "0");
  canvas.focus();
  if (ctx.getImageData) {
    hasImageData = true;
    imageData = ctx.getImageData(0, 0, 256, 192);
    imageDataData = imageData.data;
  } else {
    hasImageData = false;
  }

  kybd_init();
}

function readport(addr) {
  var a,
    h,
    i,
    mask,
    retval = 0xff;
  if (addr == 0x7fef) {
    return 0;
  }
  a = addr & 0xff;
  if (a == 0x0f || a == 0x1f) {
    return 0xff;
    //	  return zxregsA[zxregA]; // some games expect 0xff
  } else if (a == 0x5f) {
    mtmode = addr >> 8;
    console.log("MT mode " + mtmode.toFixed());
  } else if (a == 0xf5) {
    if (tsw.isBrowserSupported) {
      psgB.oscfreq(65535 / (1 + z80.e));
      psgB.beep(0.5);
    }
  } else if (a == 0xfb) {
    return 0xff;
  } else if (a == 0xfe) {
    if (!nmigen) hsygen = false;
    h = addr >> 8;
    switch (h) {
      case 0xfe:
        return keyStates[0];
        break;
      case 0xfd:
        return keyStates[1];
        break;
      case 0xfb:
        return keyStates[2];
        break;
      case 0xf7:
        return keyStates[3];
        break;
      case 0xef:
        return keyStates[4];
        break;
      case 0xdf:
        return keyStates[5];
        break;
      case 0xbf:
        return keyStates[6];
        break;
      case 0x7f:
        return keyStates[7];
        break;
      default:
        for (i = 0, mask = 1; i < 8; i++, mask <<= 1)
          if (!(h & mask)) retval &= keyStates[i];
        return retval;
    }
  }
  return 0xff;
}

function writeport(addr, val) {
  var a, f, fe, rgb;
  if (addr == 0x7fef) {
    chromamode = val & 0x30;
    if (chromamode) {
      //	    expanded=true;
      //	    document.getElementById('memory').value='56K';
      cscheme = 2;
      //	    document.getElementById('color').value='Chroma';
      switch (val & 0x0f) {
        case 0x00:
          bordercolor = "#000000";
          break;
        case 0x01:
          bordercolor = "#00007f";
          break;
        case 0x02:
          bordercolor = "#7f0000";
          break;
        case 0x03:
          bordercolor = "#7f007f";
          break;
        case 0x04:
          bordercolor = "#007f00";
          break;
        case 0x05:
          bordercolor = "#007f7f";
          break;
        case 0x06:
          bordercolor = "#7f7f00";
          break;
        case 0x07:
          bordercolor = "#7f7f7f";
          break;
        case 0x08:
          bordercolor = "#000000";
          break;
        case 0x09:
          bordercolor = "#0000ff";
          break;
        case 0x0a:
          bordercolor = "#ff0000";
          break;
        case 0x0b:
          bordercolor = "#ff00ff";
          break;
        case 0x0c:
          bordercolor = "#00ff00";
          break;
        case 0x0d:
          bordercolor = "#00ffff";
          break;
        case 0x0e:
          bordercolor = "#ffff00";
          break;
        case 0x0f:
          bordercolor = "#ffffff";
          break;
      }
    } else {
      cscheme = 0;
      bordercolor = "white";
    }
    rgb = bordercolor;
    rfill = parseInt("0x" + rgb.substr(1, 2));
    gfill = parseInt("0x" + rgb.substr(3, 2));
    bfill = parseInt("0x" + rgb.substr(5, 2));
    return;
  }
  a = addr & 0xff;
  if (a == 0x0f || a == 0x1f) {
    if (!tsw.isBrowserSupported) return;
    zxregsA[zxregA] = val;
    handleZonX();
    return;
  } else if (a == 0xcf || a == 0xdf) {
    zxregA = val;
  } else if (a == 0xfd) {
    nmigen = false;
    hsygen = true;
  } else if (a == 0xfe) {
    if (zx80) hsygen = true;
    else nmigen = true;
  } else if (a == 0xff || a == 0x07) {
    hsygen = true;
  }
}

function paintScreen() {
  if (hasImageData) {
    for (var i = 3; i < 256 * 192 * 4; i += 4) imageDataData[i] = opacity;
    ctx.putImageData(imageData, 0, 0);
    if (opacity > 0) opacity--;
  }
}

function wallpaper() {
  if (!hasImageData) return;
  ctxb.putImageData(imageData, 0, 0);
}
