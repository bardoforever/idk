extends Node3D
class_name Pickup
## One item, from the floor, into your arms, onto a shelf.

enum State { ON_FLOOR, FLYING_TO_PLAYER, CARRIED, FLYING_TO_SHELF, FLYING_TO_FLOOR, SHELVED }

var item: Dictionary = {}
var state: State = State.ON_FLOOR
var carry_index := 0

var _mesh: MeshInstance3D
var _label: Label3D
var _flight_from := Vector3.ZERO
var _flight_to := Vector3.ZERO
var _flight_t := 0.0
var _flight_len := 0.2
var _spin := 0.0

func setup(item_data: Dictionary, pos: Vector3) -> void:
	item = item_data
	position = pos
	_spin = randf() * TAU

	_mesh = MeshInstance3D.new()
	var bm := BoxMesh.new()
	var premium: bool = item.get("rarity", "common") == "premium"
	bm.size = Vector3(0.34, 0.34, 0.34) if not premium else Vector3(0.4, 0.4, 0.4)
	_mesh.mesh = bm
	var m := StandardMaterial3D.new()
	m.albedo_color = Catalog.section_color(item["section"])
	m.roughness = 0.9
	m.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	if premium:
		m.emission_enabled = true
		m.emission = Color("#C9A227")
		m.emission_energy_multiplier = 0.4
	_mesh.material_override = m
	_mesh.rotation.y = _spin
	add_child(_mesh)

	# Name tag, shown only when you are close enough to read it.
	_label = Label3D.new()
	_label.text = String(item["name"])
	_label.font_size = 64
	_label.pixel_size = 0.0042
	_label.position = Vector3(0, 0.5, 0)
	_label.modulate = Color("#2B2620")
	_label.outline_size = 16
	_label.outline_modulate = Color("#F6F1E7")
	_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_label.no_depth_test = true
	_label.visible = false
	add_child(_label)

func set_label_visible(on: bool) -> void:
	if _label and _label.visible != on:
		_label.visible = on

func fly_to_player(target: Vector3) -> void:
	_begin_flight(target, Cfg.PICKUP_FLIGHT)
	state = State.FLYING_TO_PLAYER

func fly_to_shelf(target: Vector3) -> void:
	_begin_flight(target, Cfg.DELIVER_FLIGHT)
	state = State.FLYING_TO_SHELF
	set_label_visible(false)

## A wrong sort: tossed back onto the floor where you tried it. Nothing is
## lost - the shop is just messier than it was, and that is your doing.
func fly_to_floor(target: Vector3) -> void:
	_begin_flight(target, Cfg.DELIVER_FLIGHT)
	state = State.FLYING_TO_FLOOR
	set_label_visible(false)

func land_on_floor() -> void:
	state = State.ON_FLOOR
	carry_index = 0

func _begin_flight(target: Vector3, length: float) -> void:
	_flight_from = global_position
	_flight_to = target
	_flight_t = 0.0
	_flight_len = length

## Returns true on the frame the flight lands.
func advance_flight(delta: float) -> bool:
	_flight_t += delta
	var t: float = clamp(_flight_t / _flight_len, 0.0, 1.0)
	var eased: float = 1.0 - pow(1.0 - t, 3.0)
	var pos := _flight_from.lerp(_flight_to, eased)
	# A little arc so it reads as thrown, not slid.
	pos.y += sin(t * PI) * 0.8
	global_position = pos
	if _mesh:
		_mesh.rotation.y = _spin + t * 6.0
	return t >= 1.0

func settle_at(pos: Vector3) -> void:
	global_position = pos
	state = State.SHELVED
	if _mesh:
		_mesh.rotation.y = _spin

func follow_carry(anchor: Vector3, delta: float) -> void:
	var target := anchor + Vector3(0, carry_index * Cfg.STACK_SPACING, 0)
	global_position = global_position.lerp(target, clamp(delta * 18.0, 0.0, 1.0))
	if _mesh:
		_mesh.rotation.y += delta * 1.2
