extends Node3D
## Slice 1: walk the shop and sort it.
##
## The loop, in the order you do it:
##   run to a mess  ->  tap an item to pick it up  ->  read what you are holding
##   ->  run to a section  ->  tap the shelf to send the next item there.
##
## Nothing is automatic. Auto-pickup and streak forgiveness are upgrades you
## buy later; until then you pick every item up by hand and every mistake
## costs you a fee, four seconds, and your streak.

const ITEMS_ON_FLOOR := 46      ## target loose items; also the perf dial
const PILE_SIZE := 7

var shop: Shop
var player: Player
var hud: HUD
var camera: Camera3D

var carried: Array[Pickup] = []
var flying: Array[Pickup] = []

var cash_cents := 0
var delivered := 0
var wrong_sorts := 0
var streak := 0
var best_combo_steps := 0
var combo_steps := 0
var forgiveness_left := Cfg.STREAK_FORGIVENESS
var shift_left := Cfg.SHIFT_SECONDS
var running := true

var autopilot := false
var autopilot_error_rate := 0.0
var _label_tick := 0.0
var _perf_tick := 0.0
var _tap_cooldown := 0.0

func _ready() -> void:
	_read_cmdline()
	_build_world()

	shop = Shop.new()
	add_child(shop)
	shop.build(randi())
	shop.spawn_piles(PILE_SIZE)

	player = Player.new()
	player.position = Vector3(0, 0, 17)
	add_child(player)

	hud = HUD.new()
	add_child(hud)
	hud.joystick_moved.connect(_on_joystick)
	hud.world_tapped.connect(_on_world_tap)
	hud.set_carried([], Cfg.CARRY_CAPACITY)

func _read_cmdline() -> void:
	var args := OS.get_cmdline_args()
	autopilot = "--autopilot" in args
	var i := args.find("--error-rate")
	if i != -1 and i + 1 < args.size():
		autopilot_error_rate = float(args[i + 1])

func _build_world() -> void:
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("#F6F1E7")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("#FFF4E2")
	e.ambient_light_energy = 0.75
	env.environment = e
	add_child(env)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-62, -38, 0)
	sun.light_energy = 0.85
	sun.light_color = Color("#FFF6E8")
	sun.shadow_enabled = false   # phones first; shadows are the next thing to test
	add_child(sun)

	camera = Camera3D.new()
	camera.fov = 48.0
	add_child(camera)

func _on_joystick(direction: Vector2) -> void:
	if player:
		player.move_direction = direction if running else Vector2.ZERO

func _process(delta: float) -> void:
	if not player:
		return

	_follow_camera(delta)
	_tap_cooldown = max(0.0, _tap_cooldown - delta)

	if running:
		shift_left -= delta
		if shift_left <= 0.0:
			shift_left = 0.0
			_end_shift()

	if autopilot and running:
		_drive_autopilot()

	_advance_flights(delta)
	_carry(delta)
	if running:
		if Cfg.AUTO_PICKUP_UNLOCKED:
			_auto_collect()
		_highlight_shelves()

	_nearby_labels(delta)
	_update_hud(delta)

func _follow_camera(delta: float) -> void:
	var target := player.global_position + Vector3(0, 15.5, 11.0)
	camera.global_position = camera.global_position.lerp(target, clamp(delta * 6.0, 0.0, 1.0))
	camera.look_at(player.global_position + Vector3(0, 1.0, 0), Vector3.UP)

# ---------------------------------------------------------------- tapping ---

## A tap means: hand the next item to this shelf, or pick that item up.
func _on_world_tap(screen_position: Vector2) -> void:
	if not running or _tap_cooldown > 0.0:
		return
	# A shelf you are stood at wins, so you can unload while inside a pile.
	var shelf := _shelf_under(screen_position)
	if shelf != null and not carried.is_empty():
		_place_next_at(shelf)
		return
	var pickup := _item_under(screen_position)
	if pickup != null:
		_pick_up(pickup)
	elif shelf != null:
		hud.toast("Your arms are empty")

func _shelf_under(screen_position: Vector2) -> Shelf:
	var best: Shelf = null
	var best_score := Cfg.TAP_SLOP_PX * 2.0
	for shelf in shop.shelves:
		if shelf.distance_to(player.global_position) > Cfg.DROP_RADIUS:
			continue
		var screen := _to_screen(_shelf_anchor(shelf))
		if screen == Vector2.INF:
			continue
		var d := screen.distance_to(screen_position)
		if d < best_score:
			best_score = d
			best = shelf
	return best

func _shelf_anchor(shelf: Shelf) -> Vector3:
	var z: float = clamp(player.global_position.z, shelf.global_position.z - 6.0, shelf.global_position.z + 6.0)
	return Vector3(shelf.global_position.x, 1.0, z)

func _item_under(screen_position: Vector2) -> Pickup:
	if carried.size() >= Cfg.CARRY_CAPACITY:
		hud.toast("Arms full")
		return null
	var reach_sq := Cfg.PICKUP_REACH * Cfg.PICKUP_REACH
	var best: Pickup = null
	var best_score := Cfg.TAP_SLOP_PX
	for p in shop.floor_items:
		if not is_instance_valid(p) or p.state != Pickup.State.ON_FLOOR:
			continue
		if player.global_position.distance_squared_to(p.global_position) > reach_sq:
			continue
		var screen := _to_screen(p.global_position + Vector3(0, 0.2, 0))
		if screen == Vector2.INF:
			continue
		var d := screen.distance_to(screen_position)
		if d < best_score:
			best_score = d
			best = p
	return best

func _to_screen(world: Vector3) -> Vector2:
	if camera.is_position_behind(world):
		return Vector2.INF
	return camera.unproject_position(world)

func _pick_up(p: Pickup) -> void:
	p.fly_to_player(player.carry_anchor)
	flying.append(p)
	_tap_cooldown = 0.06

# --------------------------------------------------------------- placing ---

## One tap, one item: the oldest thing in your arms goes at this shelf.
## The HUD marks which one is next, so this is a decision and not a lottery.
func _place_next_at(shelf: Shelf) -> void:
	var p: Pickup = carried.pop_front()
	if not is_instance_valid(p):
		return
	_reindex_carried()
	_tap_cooldown = Cfg.UNLOAD_INTERVAL

	if p.item["section"] == shelf.section_key:
		p.fly_to_shelf(shelf.accept_slot())
		flying.append(p)
		_on_correct(p.item)
	else:
		_on_wrong(p, shelf)

func _on_correct(item: Dictionary) -> void:
	delivered += 1
	streak += 1
	if streak % Cfg.COMBO_PER_STEP == 0:
		combo_steps = min(combo_steps + 1, Cfg.COMBO_MAX_STEPS)
		best_combo_steps = max(best_combo_steps, combo_steps)

	cash_cents += int(round(Catalog.item_value(item) * Cfg.combo_multiplier(combo_steps)))

	if int(item.get("stamina", 0)) > 0:
		shift_left = min(shift_left + Cfg.COFFEE_SECONDS, Cfg.SHIFT_SECONDS)
		hud.toast("+%ds on the clock" % int(Cfg.COFFEE_SECONDS))

	shop.top_up(ITEMS_ON_FLOOR)

## A wrong sort costs a fee and four seconds, and breaks your streak unless
## you have bought forgiveness. The item lands back on the floor - nothing is
## destroyed, you have just made the shop messier than it was.
func _on_wrong(p: Pickup, shelf: Shelf) -> void:
	wrong_sorts += 1
	cash_cents = max(0, cash_cents - Cfg.WRONG_SORT_FEE)
	shift_left = max(0.0, shift_left - Cfg.WRONG_SORT_SECONDS)

	if forgiveness_left > 0:
		forgiveness_left -= 1
		hud.toast("%s — let off (%d left)" % [Catalog.section_name(p.item["section"]), forgiveness_left])
	else:
		streak = 0
		combo_steps = max(0, combo_steps - 1)
		hud.toast("%s, not here   −$%0.2f   −%ds" % [
			Catalog.section_name(p.item["section"]),
			Cfg.WRONG_SORT_FEE / 100.0,
			int(Cfg.WRONG_SORT_SECONDS)])

	var away := player.global_position - shelf.global_position
	away.y = 0.0
	if away.length() < 0.1:
		away = Vector3.FORWARD
	var spill := _shelf_anchor(shelf) + away.normalized() * 1.7
	spill += Vector3(randf_range(-0.7, 0.7), 0, randf_range(-0.7, 0.7))
	spill.y = 0.18
	p.fly_to_floor(spill)
	flying.append(p)

# -------------------------------------------------------------- carrying ---

func _advance_flights(delta: float) -> void:
	for i in range(flying.size() - 1, -1, -1):
		var p: Pickup = flying[i]
		if not is_instance_valid(p):
			flying.remove_at(i)
			continue
		if not p.advance_flight(delta):
			continue
		flying.remove_at(i)
		match p.state:
			Pickup.State.FLYING_TO_PLAYER:
				p.state = Pickup.State.CARRIED
				p.carry_index = carried.size()
				carried.append(p)
			Pickup.State.FLYING_TO_SHELF:
				p.settle_at(p.global_position)
			Pickup.State.FLYING_TO_FLOOR:
				p.land_on_floor()

func _carry(delta: float) -> void:
	var anchor := player.carry_anchor
	for p in carried:
		if is_instance_valid(p):
			p.follow_carry(anchor, delta)

func _reindex_carried() -> void:
	for i in carried.size():
		if is_instance_valid(carried[i]):
			carried[i].carry_index = i

## Auto-pickup. The bought upgrade, not the default: until someone spends
## money on it, every item in this shop is picked up by hand.
func _auto_collect() -> void:
	if carried.size() + _incoming() >= Cfg.CARRY_CAPACITY:
		return
	var radius_sq := Cfg.AUTO_PICKUP_RADIUS * Cfg.AUTO_PICKUP_RADIUS
	for p in shop.floor_items:
		if not is_instance_valid(p) or p.state != Pickup.State.ON_FLOOR:
			continue
		if player.global_position.distance_squared_to(p.global_position) > radius_sq:
			continue
		_pick_up(p)
		if carried.size() + _incoming() >= Cfg.CARRY_CAPACITY:
			return

func _incoming() -> int:
	var n := 0
	for p in flying:
		if is_instance_valid(p) and p.state == Pickup.State.FLYING_TO_PLAYER:
			n += 1
	return n

func _highlight_shelves() -> void:
	# Only the aisle the NEXT item wants, so the hint answers the question
	# you are actually asking.
	var wanted := ""
	if not carried.is_empty() and is_instance_valid(carried[0]):
		wanted = carried[0].item["section"]
	for shelf in shop.shelves:
		shelf.set_highlighted(shelf.section_key == wanted)

## Only label what you could plausibly read, so the floor stays quiet.
func _nearby_labels(delta: float) -> void:
	_label_tick -= delta
	if _label_tick > 0.0:
		return
	_label_tick = 0.1
	var origin := player.global_position
	for p in shop.floor_items:
		if not is_instance_valid(p):
			continue
		if p.state == Pickup.State.ON_FLOOR:
			p.set_label_visible(origin.distance_squared_to(p.global_position) < 36.0)
		elif p.state != Pickup.State.CARRIED:
			p.set_label_visible(false)

func _update_hud(delta: float) -> void:
	hud.set_cash(cash_cents)
	hud.set_combo(Cfg.combo_multiplier(combo_steps), streak)
	hud.set_shift(shift_left, Cfg.SHIFT_SECONDS)

	var names: Array = []
	for p in carried:
		if is_instance_valid(p):
			names.append({"name": p.item["name"], "section": Catalog.section_name(p.item["section"])})
	hud.set_carried(names, Cfg.CARRY_CAPACITY)

	_perf_tick -= delta
	if _perf_tick <= 0.0:
		_perf_tick = 0.5
		var loose := 0
		for p in shop.floor_items:
			if is_instance_valid(p) and p.state == Pickup.State.ON_FLOOR:
				loose += 1
		hud.set_perf(Engine.get_frames_per_second(), loose, shop.floor_items.size())

func _end_shift() -> void:
	running = false
	player.move_direction = Vector2.ZERO
	hud.toast("Shop's closed — %d away, $%0.2f" % [delivered, cash_cents / 100.0])
	if autopilot:
		_print_shift_report()

# ------------------------------------------------------------- autopilot ---

## Plays the way a competent person would: grab an armful, then walk each item
## to the aisle it belongs in. --error-rate makes it misjudge that fraction of
## placements, so the penalty path gets exercised rather than assumed.
##
## It is a PERFECT-MEMORY benchmark, never a human one: it never has to read a
## label or remember where Acetate Disc lives, which is the actual game.
func _drive_autopilot() -> void:
	var target := _autopilot_target()
	if target == Vector3.INF:
		player.move_direction = Vector2.ZERO
		return
	var to_target := target - player.global_position
	player.move_direction = Vector2(to_target.x, to_target.z).normalized()

	if carried.size() < Cfg.CARRY_CAPACITY and _tap_cooldown <= 0.0:
		var reach_sq := Cfg.PICKUP_REACH * Cfg.PICKUP_REACH
		for p in shop.floor_items:
			if not is_instance_valid(p) or p.state != Pickup.State.ON_FLOOR:
				continue
			if player.global_position.distance_squared_to(p.global_position) <= reach_sq:
				_pick_up(p)
				return

	if not carried.is_empty() and _tap_cooldown <= 0.0:
		var intended := _autopilot_shelf()
		if intended != null and intended.distance_to(player.global_position) <= Cfg.DROP_RADIUS:
			_place_next_at(intended)

func _autopilot_shelf() -> Shelf:
	if carried.is_empty() or not is_instance_valid(carried[0]):
		return null
	var correct: String = carried[0].item["section"]
	if autopilot_error_rate > 0.0 and randf() < autopilot_error_rate:
		# Misjudge it, the way a person who half-remembers the shop would.
		var options: Array = Catalog.shelf_sections()
		var guess: String = options[randi() % options.size()]
		if guess != correct:
			return shop.shelf_for(guess)
	return shop.shelf_for(correct)

func _autopilot_target() -> Vector3:
	if carried.size() >= Cfg.CARRY_CAPACITY:
		return _next_shelf_position()
	var best := Vector3.INF
	var best_dist := INF
	for p in shop.floor_items:
		if not is_instance_valid(p) or p.state != Pickup.State.ON_FLOOR:
			continue
		var d := player.global_position.distance_squared_to(p.global_position)
		if d < best_dist:
			best_dist = d
			best = p.global_position
	if best == Vector3.INF and not carried.is_empty():
		return _next_shelf_position()
	return best

func _next_shelf_position() -> Vector3:
	var shelf := _autopilot_shelf()
	if shelf == null:
		return Vector3.INF
	return _shelf_anchor(shelf)

func _print_shift_report() -> void:
	var attempts := delivered + wrong_sorts
	var accuracy := 100.0 * delivered / float(max(1, attempts))
	print("")
	print("  THE CORNER SHOP — autopilot shift")
	print("  shift length     %0.0fs" % Cfg.SHIFT_SECONDS)
	print("  error rate       %0.0f%%" % (autopilot_error_rate * 100.0))
	print("  shelved          %d" % delivered)
	print("  wrong sorts      %d  (%0.0f%% accurate)" % [wrong_sorts, accuracy])
	print("  earned           $%0.2f" % (cash_cents / 100.0))
	print("  best multiplier  %0.2fx" % Cfg.combo_multiplier(best_combo_steps))
	print("  carry capacity   %d   move speed %0.1f m/s" % [Cfg.CARRY_CAPACITY, Cfg.MOVE_SPEED])
	print("")
	get_tree().quit()
