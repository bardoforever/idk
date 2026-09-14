extends Node
## Tuning for the walking sorting loop. Slice 1 numbers are about FEEL,
## not balance - the economy gets retuned against a clock in slice 3.

# --- movement ---
const MOVE_SPEED := 6.0          ## metres/sec at rank 0
const ACCEL := 40.0              ## how fast you reach top speed
const FRICTION := 28.0

# --- carrying ---
const CARRY_CAPACITY := 6        ## items in your arms at rank 0
const MAGNET_RADIUS := 2.2       ## metres; auto-pickup upgrade widens this
const PICKUP_FLIGHT := 0.28      ## seconds for an item to fly to your arms
const STACK_SPACING := 0.22      ## visual gap between carried items

# --- delivering ---
const DROP_RADIUS := 2.6         ## how close to a shelf counts as "at" it
const UNLOAD_INTERVAL := 0.11    ## seconds between items leaving your arms
const DELIVER_FLIGHT := 0.22

# --- the shift ---
const SHIFT_SECONDS := 180.0     ## a 3 minute opening at rank 0
const COFFEE_SECONDS := 12.0     ## what a break item gives back

# --- combo ---
const COMBO_DECAY_AFTER := 6.0   ## idle seconds before the combo steps down
const COMBO_PER_STEP := 5        ## deliveries to climb a step
const COMBO_INCREMENT := 0.25
const COMBO_MAX_STEPS := 8

# --- payouts (placeholder until slice 3) ---
const VALUE_COMMON := 200
const VALUE_PREMIUM := 800

static func combo_multiplier(steps: int) -> float:
	return 1.0 + min(steps, COMBO_MAX_STEPS) * COMBO_INCREMENT
