#include <zx81.h>
#include <string.h>


#define ZXPRINTER_CHAR_COLUMNS 32


/* Print to ZX printer without adding a newline. */
void lprint_center(char *text)
{
    const unsigned char lpadding = (ZXPRINTER_CHAR_COLUMNS - strlen(text)) >> 1;
    unsigned char i;

    for (i = 0; i < lpadding; ++i) {
        zx_lprintc(' ');
    }
    for (i = 0; text[i] != 0; ++i) {
        zx_lprintc(text[i]);
    }
}


/* Print to ZX printer and add a newline. */
void lprintln_center(char *text)
{
    lprint_center(text);
    zx_lprintc(10);
}


