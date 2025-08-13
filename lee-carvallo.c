// Lee Carvallo's Putting Challenge
// For ZX81 / Timex Sinclair 1000
// Copyright 2025 by Eric Odland
//
// Compile with z88dk:
// zcc -v +zx81 -create-app lee-carvallo.c zxprint.c
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <math.h>
#include <graphics.h>

#include "zxprint.h"

#define CHAR_WIDTH 32
#define CHAR_HEIGHT 24
#define CHAR_MENU_TOP 2
#define CHAR_MENU_LEFT 1
#define CHAR_MENU_RIGHT (CHAR_WIDTH - 1)

// Heights of text areas (line height)
#define TITLE_LINE_HEIGHT 2
#define STATUS_LINE_HEIGHT 4

// Graphic "pixels" are 1/2 the width x height
// of characters
#define GFX_BORDER_TOP (2 * (TITLE_LINE_HEIGHT + STATUS_LINE_HEIGHT))
#define GFX_BORDER_LEFT 0
#define GFX_BORDER_BOTTOM ((24 * 2) - 1)
#define GFX_BORDER_WIDTH (32 * 2)
#define GFX_BORDER_RIGHT (GFX_BORDER_WIDTH + GFX_BORDER_LEFT - 1)
#define GFX_BORDER_HEIGHT (GFX_BORDER_BOTTOM - GFX_BORDER_TOP)

// The force value that signifies a "power drive"
#define POWER_DRIVE_FORCE 0

#ifdef VCFWEST
    #define NUM_HOLES 1
#else
    #define NUM_HOLES 5
#endif

#define STR_LEN(s) (sizeof(s) - 1)

typedef struct {
    unsigned char restart;
    unsigned char hole_num;
    unsigned char score_hole;
} GameStatus;

#define BALL_DAMPING 0.97f
#define BALL_AT_REST_THRESHOLD_VELOCITY 0.1f
#define BALL_IN_HOLE_THRESHOLD_VELOCITY 2.0f

// Convert analog clock hour to degrees (30 degrees per hour)
#define CLOCK_TO_DEGREES 30.0f
#define DEG_TO_RAD (M_PI / 180.0f)
#define NORTH_ANGLE_OFFSET -90

// Will be multiplied to force_table
#define FORCE_TABLE_MULTIPLIER 0.125
const int FORCE_TABLE[9] = {
    2,
    4,
    6,
    8,
    16,
    80,
    200,
    400,
    POWER_DRIVE_FORCE
};

unsigned char hole_x, hole_y;
unsigned char ball_x, ball_y;


/**
* Print text followed by a number with leading zero if needed
* @param x_pos X position for printing
* @param text Text to print before the number
* @param number Number to display after the text
*/
void print_text_and_number(unsigned char x_pos, const char* text, unsigned char number)
{
    const unsigned char inverse_zero = 0x9c;

    zx_setcursorpos(GFX_BORDER_BOTTOM / 2, x_pos);
    printf("%s", text);
    zx_asciimode(0);
    fputc_cons(0x8e);  // inverse colon

    if (number >= 10) { // 10s digit
        fputc_cons(inverse_zero + number / 10);
    }
    else {
        fputc_cons(0x80); //space
    }

    // 1s digit
    fputc_cons(inverse_zero + number % 10);
    zx_asciimode(1);
}

/**
* Display score on screen, 2 digits max
* @param score Score value to display
*/
void display_score(unsigned char score)
{
    print_text_and_number(GFX_BORDER_RIGHT / 2 - 8, "SCORE", score);
}

/**
* Display current hole number on screen
* @param hole Hole number to display
*/
void display_hole_num(unsigned char hole)
{
    print_text_and_number(GFX_BORDER_RIGHT / 2 - 16, "HOLE", hole);
}

/**
* Display game border and title at the top of the screen
*/
void display_border_and_title()
{
    // draw border
    drawb(GFX_BORDER_LEFT, GFX_BORDER_TOP, GFX_BORDER_WIDTH, GFX_BORDER_HEIGHT);

    // print title
    zx_setcursorpos(0, 0);
    puts("lee carvallo's putting challenge");

    for (unsigned char i = CHAR_WIDTH; i != 0; --i) {
        fputc_cons('*');
    }
}

/**
* Display menu options on screen
* @param menu Array of menu strings
* @param lines Number of menu lines to display
*/
void display_menu(const char* menu[], unsigned char lines) __z88dk_callee {
    int i;

    for (i = 0; i < lines; ++i)
    {
        zx_setcursorpos(i + CHAR_MENU_TOP, CHAR_MENU_LEFT);
        puts(menu[i]);
    }

    // Set to next line
    zx_setcursorpos(i + CHAR_MENU_TOP, CHAR_MENU_LEFT);
}


/**
* Clear the menu above the playing area
*/
void clear_menu_area()
{
    clga(
        0,
        2 * CHAR_MENU_TOP,
        getmaxx(),
        2 * STATUS_LINE_HEIGHT
    );
}


/**
* Clear the game field area, preserving the border
*/
void clear_field()
{
    clga(
        GFX_BORDER_LEFT + 1,
        GFX_BORDER_TOP + 1,
        GFX_BORDER_WIDTH - 2,
        GFX_BORDER_HEIGHT - 2
    );
}


/**
* Wait for any key to be pressed.
*/
void wait_keypress()
{
    while (getk() == 0) {}
}


/**
* Display the welcome screen with title and instructions.
*/
void show_welcome_screen()
{
    static const char* menu[] = {
        "welcome to lee carvallo's",
        "putting challenge. i am",
        "carvallo.",
        "> press any key to start <"
    };
    static const unsigned char lines = sizeof(menu) / sizeof(menu[0]);
    display_menu(menu, lines);
    wait_keypress();
    clear_menu_area();
}


/**
* Get input for club selection from the player.
* @return Selected club (1 for putter, 2 for 3-wood)
*/
unsigned char input_club()
{
    static const char* menu[] = {
        "now, choose a club.",
        "",
        "1) putter",
        "2) 3-wood"
    };
    display_menu(menu, sizeof(menu) / sizeof(menu[0]));

    while (1) {
        unsigned char choice = getk();

        if (choice >= '1' && choice <= '2') {
            clear_menu_area();
            return choice - '0';
        }
    }
}


/**
* Get direction input from player in clock format (0.0-12.0).
* @return Direction value entered by player
*/
float input_direction()
{
    static const char* menu[] = {
        "enter direction",
        "(0.0 - 12.0, like the face",
        " of a clock)"
    };
    display_menu(menu, sizeof(menu) / sizeof(menu[0]));

    char line[10];
    fputs("> ", stdout);  // fputs doesn't add a newline whereas puts does
    fgets_cons(line, sizeof(line));

    clear_menu_area();
    return atof(line);
}


/**
* Get force input from player (1-9, with 9 being power drive).
* @return Force value based on player selection
*/
float input_force()
{
    static const char* menu[] = {
        "enter the force of your swing",
        // "1 to 9",
        "  1) feather touch",
        "2-8) midranges",
        "  9) POWER@DRIVE"
    };
    display_menu(menu, sizeof(menu) / sizeof(menu[0]));

    while (1) {
        const unsigned char choice = getk();

        if (choice >= '1' && choice <= '9') {
            clear_menu_area();
            return FORCE_TABLE_MULTIPLIER * FORCE_TABLE[choice - '1'];
        }
    }
}


/**
* Ask if player wants to play again after ball is in parking lot.
* @return 'y' if yes, 'n' if no
*/
unsigned char input_play_again()
{
    static const char* menu[] = {
        "ball is in: parking lot.",
        "would you like to try again?",
        "(y/n)"
    };
    display_menu(menu, sizeof(menu) / sizeof(menu[0]));

    unsigned char choice;

    while (1) {
        choice = getk();

        if (choice == 'y') {
            break;
        }

        if (choice == 'n') {
            zx_setcursorpos(4 + CHAR_MENU_TOP, CHAR_MENU_LEFT);
            puts("you have selected: NO");
            sleep(1);
            break;
        }
    }

    clear_menu_area();
    return choice;
}


/**
* Generate random positions for ball and hole, ensuring a minimum distance.
*/
void randomize_ball_and_hole()
{
    static const unsigned char min_distance = GFX_BORDER_HEIGHT / 2;
    srand(clock());

    // Randomize ball and hole position until they are at least 'min_distance' units
    // away from each other (prevents ball being too close to hole).
    do {
        hole_x = rand() % ((GFX_BORDER_WIDTH - 4) / 2) + 1;
        hole_y = rand() % (min_distance - 2) + 1 + GFX_BORDER_TOP / 2;
        ball_x = rand() % (GFX_BORDER_WIDTH - 2) + 1;
        ball_y = rand() % (GFX_BORDER_HEIGHT - 2) + 1 + GFX_BORDER_TOP;
    } while ((abs(2 * hole_x - ball_x) <= min_distance)
             && (abs(2 * hole_y - ball_y) <= min_distance));
}


/**
* Plot the hole on the screen at its current position.
*/
void plot_hole()
{
    zx_setcursorpos(hole_y, hole_x);
    putchar('O');
}


/**
* Initialize the game field with randomized ball and hole positions.
*/
void setup_playfield()
{
    randomize_ball_and_hole();
    plot(ball_x, ball_y);
    plot_hole();
}


/**
* Clear previous ball and hole positions from the screen.
* Don't call this until after `setup_playfield` has been called at least once.
*/
void reset_playfield()
{
    unplot(ball_x, ball_y);
    zx_setcursorpos(hole_y, hole_x);
    putchar(' ');
}


/**
* Run simulation of ball movement after being hit.
* Returns after ball settles.
*
* @param direction Angle in clock format (0.0-12.0)
* @param force Initial velocity of the ball
* @return 1 if ball lands in hole, 0 otherwise
*/
unsigned char run_swing_sequence(float direction, float velocity)
{
    float fball_x = (float)ball_x;
    float fball_y = (float)ball_y;
    unsigned char prev_x = ball_x;
    unsigned char prev_y = ball_y;
    float dx, dy;
    float angle = DEG_TO_RAD * (-90 + CLOCK_TO_DEGREES * direction);
    dx = velocity * cos(angle);
    dy = velocity * sin(angle);

    while (velocity >= BALL_AT_REST_THRESHOLD_VELOCITY) {
        fball_x += dx;
        fball_y += dy;

        if (fball_x <= GFX_BORDER_LEFT + 1 || fball_x >= GFX_BORDER_RIGHT - 1) {
            dx = -dx;
            fball_x = (fball_x < GFX_BORDER_LEFT + 1) ? GFX_BORDER_LEFT + 1 : GFX_BORDER_RIGHT - 1;
        }

        if (fball_y <= GFX_BORDER_TOP + 1 || fball_y >= GFX_BORDER_BOTTOM - 2) {
            dy = -dy;
            fball_y = (fball_y < GFX_BORDER_TOP + 1) ? GFX_BORDER_TOP + 1 : GFX_BORDER_BOTTOM - 2;
        }

        ball_x = (unsigned char)(fball_x + 0.5f);
        ball_y = (unsigned char)(fball_y + 0.5f);

        unplot(prev_x, prev_y);
        plot_hole();
        plot(ball_x, ball_y);

        if (velocity < BALL_IN_HOLE_THRESHOLD_VELOCITY) {
            if (ball_x >= 2 * hole_x && ball_x <= 2 * hole_x + 1 &&
                ball_y >= 2 * hole_y && ball_y <= 2 * hole_y + 1) {
                return 1;
            }
        }

        velocity *= BALL_DAMPING;
        dx *= BALL_DAMPING;
        dy *= BALL_DAMPING;

        prev_x = ball_x;
        prev_y = ball_y;
    }

    return 0;
}


/**
* Run special animation and sequence for when player enters POWER DRIVE.
*/
void run_power_drive_sequence()
{
    static const char text[] = "you have entered";
    static const char powerdrive1[] = "POWER@DRIVE";
    static const char powerdrive2[] = "power drive";
    static const unsigned char text_y = (GFX_BORDER_BOTTOM + GFX_BORDER_TOP) / 4;
    static const unsigned char text_x = CHAR_WIDTH / 2 - ((
                                            STR_LEN(text) + STR_LEN(powerdrive1) + 1
                                        ) / 2);
    zx_setcursorpos(text_y, text_x);
    puts(text);

    for (unsigned char i = 40; i != 0; --i) {
        zx_setcursorpos(text_y, text_x + STR_LEN(text) + 1);
        puts(i % 2 ? powerdrive1 : powerdrive2);
        msleep(5);
    }

    // Scroll screen away
    for (unsigned char x = CHAR_WIDTH; x != 0; --x) {
        scrolldowntxt();
    }

    // Animate ball going into parking lot
    unsigned char prev_x;
    float dx = 1;
    float fball_x = 0;
    ball_x = 0;

    while (ball_x < getmaxx() / 2) {
        ball_x = (unsigned char)(fball_x);

        unplot(prev_x, ball_y);
        plot(ball_x, ball_y);
        fball_x += dx;
        dx *= BALL_DAMPING;
        prev_x = ball_x;
    }
}


/**
* Celebrate when ball successfully lands in hole.
*/
void celebrate_hole()
{
    zx_setcursorpos(20, 2);
    puts("ball is in: hole");

    for (unsigned char i = 20; i != 0; --i) {
        // Flash ball and hole
        plot(ball_x, ball_y);
        msleep(16);
        plot_hole();
        msleep(16);
    }

    clear_field();
}


/**
* Celebrate when player completes all holes.
*/
void celebrate_win()
{
    static const char* menu[] = {
        "YOU@HAVE@WON lee carvallo's",
        "putting challenge",
#ifdef NOPRINTOUT
        "> press any key to play again <"
#else
        "enter name to print certificate"
#endif
    };
    char name[30];
    char* ptr = NULL;

    display_menu(menu, sizeof(menu) / sizeof(menu[0]));

#ifdef NOPRINTOUT
    wait_keypress();
#else
    fputs("> ", stdout);  // fputs doesn't add a newline whereas puts does
    ptr = fgets_cons(name, sizeof(name));  // fgets_cons adds a newline

    if (ptr != NULL && name[0] != '\n') {
        zx_fast();  // seems to be needed to prevent crashing
        lprintln_center("this certifies that");
        lprint_center(name);
        lprintln_center("beat lee carvallo's putting");
#ifdef VCFWEST
        lprintln_center("challenge at the");
        lprintln_center("\"lovable luggables\" table");
        lprintln_center("at vcf west 2025");
#else
        lprintln_center("challenge");
#endif

        // Extra line feed
        for (unsigned char i = 0; i < 6; ++i) {
            lprintln_center("");
        }

        zx_slow();
    }

#endif

    clear_menu_area();
}


/**
* Handle special POWER DRIVE shot sequence.
* @param status Game status to update
*/
void handle_power_drive(GameStatus *status)
{
    run_power_drive_sequence();
    ++status->score_hole;  // 1-stroke penalty

    if (input_play_again() != 'y') {
        status->restart = 1;
    }
    else {
        reset_playfield();
        display_border_and_title();
        setup_playfield();
        display_score(status->score_hole);
    }
}


/**
* Handle normal, non-POWER DRIVE swing sequence.
* @param direction Angle in clock format (0.0-12.0)
* @param force Initial velocity of the ball
* @param status Game status to update
*/
void handle_normal_swing(float direction, float force, GameStatus *status)
{
    unsigned char ball_in_hole = run_swing_sequence(direction, force);
    display_score(status->score_hole);

    if (ball_in_hole) {
        celebrate_hole();

        if (++status->hole_num > NUM_HOLES) {
            celebrate_win();
            status->restart = 1;
        }
        else {
            reset_playfield();
            setup_playfield();
        }
    }
}


/**
* Play through a single hole.
* @param status Game status to update
*/
void play_hole(GameStatus *status)
{
    display_hole_num(status->hole_num);
    display_score(status->score_hole);
    status->score_hole++;
    float direction = input_direction();
    float force = input_force();

    if (force == POWER_DRIVE_FORCE) {
        handle_power_drive(status);
    }
    else {
        handle_normal_swing(direction, force, status);
    }
}


/**
* Main game loop that handles playing through all holes.
*/
void run_game_loop()
{
    GameStatus status = {0, 1, 0};
    input_club(); // just for fun, doesn't affect game

    while (!status.restart) {
        play_hole(&status);
    }
}


/**
* Main entry point for the game, loop forever.
*/
int main()
{
    while (1) {
        // New game
        clg();
        display_border_and_title();
        show_welcome_screen();
        setup_playfield();

        run_game_loop();
    }
}
