// compile with:
// zcc -v +zx81 -create-app printer-test.c
#include <stdio.h>
#include <graphics.h>

#include <zxprint.h>

void print_certificate()
{
    char name[32];
    fputs("enter name > ", stdout);  // fputs doesn't add a newline whereas puts does
    char* length = fgets_cons(name, sizeof(name));  // fgets_cons adds a newline
    zx_fast();  // seems to be needed to prevent crashing
    lprintln_center("this certifies that");
    lprint_center(name);
    lprintln_center("beat lee carvallo's putting");
    lprintln_center("challenge at the");
    lprintln_center("\"lovable luggables\" table");
    lprintln_center("at vcf west 2025");

    for (unsigned char i = 0; i < 6; ++i) {
        lprintln_center("");
    }

    zx_slow();
}

int main()
{
    clg();
    print_certificate();
}
