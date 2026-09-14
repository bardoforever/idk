extends Node3D
## Slice 1: walk and sort. One shop, one thumb, a clock.
## No economy yet - this exists to answer whether moving around this shop
## feels good on a phone, and how much shop a phone can hold.

const ITEMS_ON_FLOOR := 46      ## target loose items; the perf dial
const PILE_SIZE := 7

var shop: Shop
var player: Player
var hud: HUD
var camera: Camera3D

var carried: Array[Pickup] = []
var flying: Array[Pickup] = []

var cash_cents := 0
var delivered := 0
var combo_steps := 0
var since_delivery := 0.0
var shift_left := Cfg.SHIFT_SECONDS
var running := true

var autopilot := false
var _unload_cooldown := 0.0
var _label_tick := 0.0
var _perf_tick := 0.0

func _ready() -> void:
	autopilot = "--autopilot" in OS.get_cmdline_args()
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
	hud.set_carried([], Cfg.CARRY_CAPACITY)

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

	if running:
		shift_left -= delta
		if shift_left <= 0.0:
			shift_left = 0.0
			_end_shift()

	if autopilot:
		_drive_autopilot()

	_advance_flights(delta)
	_carry(delta)
	if running:
		_collect()
		_deliver(delta)
		_decay_combo(delta)

	_nearby_labels(delta)
	_update_hud(delta)

func _follow_camera(delta: float) -> void:
	# Top-down, angled back so you see the aisle bands and your own stack.
	var target := player.global_position + Vector3(0, 15.5, 11.0)
	camera.global_position = camera.global_position.lerp(target, clamp(delta * 6.0, 0.0, 1.0))
	camera.look_at(player.global_position + Vector3(0, 1.0, 0), Vector3.UP)

func _advance_flights(delta: float) -> void:
	for i in range(flying.size() - 1, -1, -1):
		var p: Pickup = flying[i]
		if not is_instance_valid(p):
			flying.remove_at(i)
			continue
		var landed := p.advance_flight(delta)
		if not landed:
			continue
		flying.remove_at(i)
		if p.state == Pickup.State.FLYING_TO_PLAYER:
			p.state = Pickup.State.CARRIED
			p.carry_index = carried.size()
			carried.append(p)
		elif p.state == Pickup.State.FLYING_TO_SHELF:
			p.settle_at(p.global_position)

func _carry(delta: float) -> void:
	var anchor := player.carry_anchor
	for p in carried:
		if is_instance_valid(p):
			p.follow_carry(anchor, delta)

## Auto-pickup: run near a thing and it leaps into your arms.
func _collect() -> void:
	if carried.size() + _incoming() >= Cfg.CARRY_CAPACITY:
		return
	var origin := player.global_position
	var radius_sq := Cfg.MAGNET_RADIUS * Cfg.MAGNET_RADIUS
	for p in shop.floor_items:
		if not is_instance_valid(p) or p.state != Pickup.State.ON_FLOOR:
			continue
		if origin.distance_squared_to(p.global_position) > radius_sq:
			continue
		p.fly_to_player(player.carry_anchor)
		flying.append(p)
		if carried.size() + _incoming() >= Cfg.CARRY_CAPACITY:
			return

func _incoming() -> int:
	var n := 0
	for p in flying:
		if is_instance_valid(p) and p.state == Pickup.State.FLYING_TO_PLAYER:
			n += 1
	return n

## Delivery: stand at the right aisle and your arms empty into it.
func _deliver(delta: float) -> void:
	_unload_cooldown = max(0.0, _unload_cooldown - delta)

	var carried_sections := {}
	for p in carried:
		if is_instance_valid(p):
			carried_sections[p.item["section"]] = true

	var at_shelf: Shelf = null
	for shelf in shop.shelves:
		var wanted: bool = carried_sections.has(shelf.section_key)
		shelf.set_highlighted(wanted)
		if wanted and shelf.distance_to(player.global_position) <= Cfg.DROP_RADIUS:
			at_shelf = shelf

	if at_shelf == null or _unload_cooldown > 0.0:
		return

	for i in carried.size():
		var p: Pickup = carried[i]
		if not is_instance_valid(p) or p.item["section"] != at_shelf.section_key:
			continue
		carried.remove_at(i)
		_reindex_carried()
		p.fly_to_shelf(at_shelf.accept_slot())
		flying.append(p)
		_unload_cooldown = Cfg.UNLOAD_INTERVAL
		_on_delivered(p.item)
		return

func _reindex_carried() -> void:
	for i in carried.size():
		if is_instance_valid(carried[i]):
			carried[i].carry_index = i

func _on_delivered(item: Dictionary) -> void:
	delivered += 1
	since_delivery = 0.0
	if delivered % Cfg.COMBO_PER_STEP == 0:
		combo_steps = min(combo_steps + 1, Cfg.COMBO_MAX_STEPS)

	var multiplier := Cfg.combo_multiplier(combo_steps)
	cash_cents += int(round(Catalog.item_value(item) * multiplier))

	var stamina: int = int(item.get("stamina", 0))
	if stamina > 0:
		shift_left = min(shift_left + Cfg.COFFEE_SECONDS, Cfg.SHIFT_SECONDS)
		hud.toast("+%ds on the clock" % int(Cfg.COFFEE_SECONDS))

	shop.top_up(ITEMS_ON_FLOOR)

## The combo is about rhythm, not accuracy: keep delivering or it slips.
func _decay_combo(delta: float) -> void:
	since_delivery += delta
	if since_delivery >= Cfg.COMBO_DECAY_AFTER and combo_steps > 0:
		combo_steps -= 1
		since_delivery = 0.0

## Only label what you could actually read, so the floor stays quiet.
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
	hud.set_combo(Cfg.combo_multiplier(combo_steps))
	hud.set_shift(shift_left, Cfg.SHIFT_SECONDS)

	var names: Array = []
	for p in carried:
		if is_instance_valid(p):
			names.append(p.item["name"])
	hud.set_carried(names, Cfg.CARRY_CAPACITY)

	_perf_tick -= delta
	if _perf_tick <= 0.0:
		_perf_tick = 0.5
		var loose := 0
		for p in shop.floor_items:
			if is_instance_valid(p) and p.state == Pickup.State.ON_FLOOR:
				loose += 1
		hud.set_perf(Engine.get_frames_per_second(), loose, shop.floor_items.size())

## Steers the player the way a competent human would: fill your arms from the
## nearest pile, then walk the load to the aisle that wants it. Used to verify
## and tune the loop headlessly, the way the old balance simulator did.
func _drive_autopilot() -> void:
	if not running:
		return
	var target := _autopilot_target()
	if target == Vector3.INF:
		player.move_direction = Vector2.ZERO
		return
	var to_target := target - player.global_position
	player.move_direction = Vector2(to_target.x, to_target.z).normalized()

func _autopilot_target() -> Vector3:
	# Arms full, or nothing left loose: go and unload.
	if carried.size() >= Cfg.CARRY_CAPACITY:
		return _shelf_target()

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
		return _shelf_target()
	return best

func _shelf_target() -> Vector3:
	if carried.is_empty():
		return Vector3.INF
	# Head for whichever wanted aisle is nearest, so it routes rather than
	# walking the shop in catalogue order.
	var best := Vector3.INF
	var best_dist := INF
	for p in carried:
		if not is_instance_valid(p):
			continue
		var shelf := shop.shelf_for(p.item["section"])
		if shelf == null:
			continue
		var d := shelf.distance_to(player.global_position)
		if d < best_dist:
			best_dist = d
			best = shelf.global_position
			best.z = clamp(player.global_position.z, shelf.global_position.z - 6.0, shelf.global_position.z + 6.0)
	return best

func _end_shift() -> void:
	running = false
	player.move_direction = Vector2.ZERO
	hud.toast("Shop's closed — %d items away, $%0.2f" % [delivered, cash_cents / 100.0])
	if autopilot:
		_print_shift_report()

func _print_shift_report() -> void:
	var per_minute := delivered / (Cfg.SHIFT_SECONDS / 60.0)
	print("")
	print("  THE CORNER SHOP — autopilot shift")
	print("  shift length     %0.0fs" % Cfg.SHIFT_SECONDS)
	print("  delivered        %d items (%0.1f/min)" % [delivered, per_minute])
	print("  earned           $%0.2f" % (cash_cents / 100.0))
	print("  best multiplier  %0.2fx" % Cfg.combo_multiplier(combo_steps))
	print("  carry capacity   %d" % Cfg.CARRY_CAPACITY)
	print("  move speed       %0.1f m/s" % Cfg.MOVE_SPEED)
	print("")
	get_tree().quit()
