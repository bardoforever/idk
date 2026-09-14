extends Node
## Tuning for the walking sorting loop. Slice 1 numbers are about FEEL,
## not balance - the economy gets retuned against a clock in slice 3.

# --- camera ---
## Godot's fov is VERTICAL by default, and on a portrait phone vertical is the
## LONG axis - so a vertical fov collapses the horizontal view to a slot. The
## camera uses KEEP_WIDTH instead, so this fov governs how much shop you see
## ACROSS, and portrait simply gives you more of it lengthwise.
const CAMERA_FOV := 50.0
const CAMERA_HEIGHT := 17.0
const CAMERA_BACK := 12.0
const CAMERA_LAG := 6.0

# --- movement ---
const MOVE_SPEED := 6.0          ## metres/sec at rank 0
const ACCEL := 40.0              ## how fast you reach top speed
const FRICTION := 28.0

# --- carrying ---
## You pick things up deliberately. Tap an item you are standing near and it
## goes in your arms. Nothing is hoovered up for free.
const CARRY_CAPACITY := 6        ## items in your arms at rank 0
const PICKUP_REACH := 3.2        ## metres you can reach to grab something
const TAP_SLOP_PX := 64.0        ## how forgiving a tap is, in screen pixels
const PICKUP_FLIGHT := 0.28      ## seconds for an item to fly to your arms
const STACK_SPACING := 0.22      ## visual gap between carried items

# --- AUTO-PICKUP: a skill-tree upgrade, off until bought ---
## This is the convenience you spend money on, not the default state.
const AUTO_PICKUP_UNLOCKED := false
const AUTO_PICKUP_RADIUS := 2.4

# --- delivering ---
## Tap a shelf and your whole armful goes at it. What belongs pays out.
## What does not is a wrong sort: it costs you, and it lands on the floor.
const DROP_RADIUS := 3.2         ## how close to a shelf counts as "at" it
const UNLOAD_INTERVAL := 0.09    ## seconds between items leaving your arms
const DELIVER_FLIGHT := 0.22
const WRONG_SORT_FEE := 100      ## cents, per item put on the wrong shelf
const WRONG_SORT_SECONDS := 1.5  ## and the time it costs you

# --- the shift ---
const SHIFT_SECONDS := 180.0     ## a 3 minute opening at rank 0
const COFFEE_SECONDS := 12.0     ## what a break item gives back

# --- combo ---
## A streak of CORRECT sorts. A wrong one breaks it.
const COMBO_PER_STEP := 5        ## correct sorts in a row to climb a step
const COMBO_INCREMENT := 0.25
const COMBO_MAX_STEPS := 8

# --- STREAK FORGIVENESS: a skill-tree upgrade, 0 until bought ---
## Mistakes per shift that do not break your streak.
const STREAK_FORGIVENESS := 0

# --- payouts (placeholder until slice 3) ---
const VALUE_COMMON := 200
const VALUE_PREMIUM := 800

static func combo_multiplier(steps: int) -> float:
	return 1.0 + min(steps, COMBO_MAX_STEPS) * COMBO_INCREMENT
