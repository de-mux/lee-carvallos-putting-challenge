String.prototype.erase=function(pos,len)
{
return this.slice(0,pos-1) + this.slice(pos+len-1);
}

function hex2(n){
if(n==undefined)return '??';
var s=n.toString(16);
if(s.length==1)s='0'+s;
return s;
}

function hex4(n){
if(n==undefined)return '??';
var s=n.toString(16);
var z='0000';
s=z.substring(0,4-s.length)+s;
return s;
}

function htoi(s) {
  var v = -1;
  if (s[0]>='0' && s[0]<='9') v = (s.charCodeAt(0)-48)*16;
  if (s[0]>='A' && s[0]<='F') v = (s.charCodeAt(0)-55)*16;
  if (s[0]>='a' && s[0]<='f') v = (s.charCodeAt(0)-87)*16;
  if (v<0) return v;
  if (s[1]>='0' && s[1]<='9') v += (s.charCodeAt(1)-48);
  if (s[1]>='A' && s[1]<='F') v += (s.charCodeAt(1)-55);
  if (s[1]>='a' && s[1]<='f') v += (s.charCodeAt(1)-87);
  return v;
}

