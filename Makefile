ZCC = $(shell which zcc)
ifeq ($(ZCC),)
$(error zcc not found in PATH)
endif

Z88DK_DIR = $(dir $(ZCC))/..
export PATH := $(Z88DK_DIR)/bin:$(PATH)
export ZCCCFG := $(Z88DK_DIR)/lib/config/

SOURCES = lee-carvallo.c zxprint.c
BASENAME = lee-carvallo
OUTNAME = $(BASENAME).P

ZCC_FLAGS = \
	-v \
	+zx81 \
	-lm \
	-create-app \
	-Cz--output -Cz$(OUTNAME) \
	-Cz--audio \
	--list \
	-o $(BASENAME).bin \
	-O3 \
	-pragma-define:CLIB_EXIT_STACK_SIZE=0 \
	$(CFLAGS)

all: $(OUTNAME)

$(OUTNAME): $(SOURCES) Makefile
	zcc $(ZCC_FLAGS) $(SOURCES)

clean:
	rm -f $(OUTNAME) $(patsubst %.P, %.wav, $(OUTNAME)) *.lis *.bin

.PHONY: all clean
