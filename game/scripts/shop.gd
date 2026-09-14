extends Node3D
class_name Shop
## Builds the shop floor from a layout spec rather than a hand-placed scene,
## because a sprawling shop has to be generated to stay maintainable - and
## because the layout is the thing we will iterate on most.

const AISLE_LENGTH := 14.0
const SHELF_HEIGHT := 1.5
const SHELF_DEPTH := 1.0
const WALL_HEIGHT := 3.0

var shelves: Array[Shelf] = []
var floor_items: Array[Pickup] = []
var bounds := Rect2(Vector2(-13, -20), Vector2(26, 42))

var _rng := RandomNumberGenerator.new()

## Where each section's shelf unit sits, and where piles spawn.
## Slice 1 is one room; unlockable wings hang off this same list later.
const LAYOUT := [
	{"section": "pigments", "pos": Vector2(-7.5, -12.0), "rot": 0.0},
	{"section": "paper",    "pos": Vector2(7.5, -12.0),  "rot": 0.0},
	{"section": "brushes",  "pos": Vector2(-7.5, 0.0),   "rot": 0.0},
	{"section": "vinyl",    "pos": Vector2(7.5, 0.0),    "rot": 0.0},
	{"section": "gear",     "pos": Vector2(-7.5, 12.0),  "rot": 0.0},
	{"section": "backroom", "pos": Vector2(7.5, 12.0),   "rot": 0.0},
]

const PILE_SPOTS := [
	Vector2(0, -14), Vector2(0, -7), Vector2(0, 0),
	Vector2(0, 7), Vector2(0, 14), Vector2(-4, -4), Vector2(4, 4),
]

func build(seed_value: int) -> void:
	_rng.seed = seed_value
	_build_floor()
	_build_walls()
	for entry in LAYOUT:
		_build_shelf(entry)

func _mat(color: Color, rough := 0.95) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = rough
	m.metallic = 0.0
	# Cheap on a phone: no specular pass, no per-pixel extras.
	m.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	return m

func _build_floor() -> void:
	var plane := MeshInstance3D.new()
	var mesh := PlaneMesh.new()
	mesh.size = bounds.size
	plane.mesh = mesh
	plane.material_override = _mat(Color("#EDE5D6"))
	plane.position = Vector3(bounds.get_center().x, 0, bounds.get_center().y)
	add_child(plane)

	var body := StaticBody3D.new()
	var col := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(bounds.size.x, 0.4, bounds.size.y)
	col.shape = box
	body.position = Vector3(bounds.get_center().x, -0.2, bounds.get_center().y)
	body.add_child(col)
	add_child(body)

func _build_walls() -> void:
	var half := bounds.size * 0.5
	var c := bounds.get_center()
	var specs := [
		{"pos": Vector3(c.x, WALL_HEIGHT * 0.5, bounds.position.y), "size": Vector3(bounds.size.x, WALL_HEIGHT, 0.5)},
		{"pos": Vector3(c.x, WALL_HEIGHT * 0.5, bounds.end.y), "size": Vector3(bounds.size.x, WALL_HEIGHT, 0.5)},
		{"pos": Vector3(bounds.position.x, WALL_HEIGHT * 0.5, c.y), "size": Vector3(0.5, WALL_HEIGHT, bounds.size.y)},
		{"pos": Vector3(bounds.end.x, WALL_HEIGHT * 0.5, c.y), "size": Vector3(0.5, WALL_HEIGHT, bounds.size.y)},
	]
	for s in specs:
		var body := StaticBody3D.new()
		body.position = s["pos"]
		var col := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = s["size"]
		col.shape = shape
		body.add_child(col)
		var vis := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = s["size"]
		vis.mesh = bm
		vis.material_override = _mat(Color("#E2D9C9"))
		body.add_child(vis)
		add_child(body)

func _build_shelf(entry: Dictionary) -> void:
	var shelf := Shelf.new()
	shelf.section_key = entry["section"]
	shelf.position = Vector3(entry["pos"].x, 0, entry["pos"].y)
	shelf.rotation.y = entry["rot"]
	add_child(shelf)
	shelf.build(AISLE_LENGTH, SHELF_HEIGHT, SHELF_DEPTH)
	shelves.append(shelf)

## Scatters a fresh mess across the floor.
func spawn_piles(count_per_pile: int) -> void:
	for spot: Vector2 in PILE_SPOTS:
		for i in count_per_pile:
			var angle := _rng.randf() * TAU
			var dist := _rng.randf() * 1.5
			var pos := spot + Vector2(cos(angle), sin(angle)) * dist
			_spawn_item(pos)

func _spawn_item(pos: Vector2) -> void:
	var item: Dictionary = Catalog.random_item(_rng)
	var pickup := Pickup.new()
	add_child(pickup)
	pickup.setup(item, Vector3(pos.x, 0.18, pos.y))
	floor_items.append(pickup)

## Adds more mess while the shift runs, so the floor never empties.
func top_up(target: int) -> void:
	var loose := 0
	for p in floor_items:
		if is_instance_valid(p) and p.state == Pickup.State.ON_FLOOR:
			loose += 1
	while loose < target:
		var spot: Vector2 = PILE_SPOTS[_rng.randi() % PILE_SPOTS.size()]
		var angle := _rng.randf() * TAU
		_spawn_item(spot + Vector2(cos(angle), sin(angle)) * _rng.randf() * 1.5)
		loose += 1

func shelf_for(section_key: String) -> Shelf:
	for s in shelves:
		if s.section_key == section_key:
			return s
	return null
