function readbyte(addr) {
	return readbyte_internal(addr);
}

function readbyte_internal(addr) {
	return memory[addr];
}

function writebyte(addr, val) {
	return writebyte_internal(addr, val)
}

function writebyte_internal(addr, val) {
	if (addr>=0x2000) memory[addr] = val;
}
