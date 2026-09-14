extends Node3D
class_name Shelf
## One section's shelf unit. Owns its drop zone and its visible fill.

var section_key: String = ""
var slots_filled := 0

const SLOT_COLUMNS := 14
const SLOT_ROWS := 3

var _length := 14.0
var _height := 1.5
var _depth := 1.0
var _label: Label3D
var _highlight: MeshInstance3D

func build(length: float, height: float, depth: float) -> void:
	_length = length
	_height = height
	_depth = depth
	var color: Color = Catalog.section_color(section_key)

	# Carcass.
	var body := StaticBody3D.new()
	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(depth, height, length)
	col.shape = shape
	col.position = Vector3(0, height * 0.5, 0)
	body.add_child(col)
	add_child(body)

	var vis := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(depth, height, length)
	vis.mesh = bm
	var m := StandardMaterial3D.new()
	m.albedo_color = Color("#D8CDB8")
	m.roughness = 1.0
	m.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	vis.material_override = m
	vis.position = Vector3(0, height * 0.5, 0)
	body.add_child(vis)

	# A coloured band so you can read the aisle from across the shop.
	var band := MeshInstance3D.new()
	var band_mesh := BoxMesh.new()
	band_mesh.size = Vector3(depth + 0.06, 0.28, length + 0.06)
	band.mesh = band_mesh
	var bmat := StandardMaterial3D.new()
	bmat.albedo_color = color
	bmat.roughness = 1.0
	bmat.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	band.material_override = bmat
	band.position = Vector3(0, height + 0.14, 0)
	add_child(band)

	# Aisle name, standing up so it reads from the top-down camera.
	_label = Label3D.new()
	_label.text = Catalog.section_name(section_key).to_upper()
	_label.font_size = 96
	_label.pixel_size = 0.0075
	_label.position = Vector3(0, height + 0.75, 0)
	_label.rotation_degrees = Vector3(-55, 90, 0)
	_label.modulate = Color("#2B2620")
	_label.outline_size = 18
	_label.outline_modulate = Color("#F6F1E7")
	_label.billboard = BaseMaterial3D.BILLBOARD_DISABLED
	_label.no_depth_test = true
	add_child(_label)

	# Ring that lights up when you are carrying something this aisle wants.
	_highlight = MeshInstance3D.new()
	var ring := TorusMesh.new()
	ring.inner_radius = Cfg.DROP_RADIUS - 0.18
	ring.outer_radius = Cfg.DROP_RADIUS
	_highlight.mesh = ring
	var hmat := StandardMaterial3D.new()
	hmat.albedo_color = color
	hmat.emission_enabled = true
	hmat.emission = color
	hmat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	hmat.albedo_color.a = 0.5
	hmat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_highlight.material_override = hmat
	_highlight.position = Vector3(0, 0.04, 0)
	_highlight.visible = false
	add_child(_highlight)

func set_highlighted(on: bool) -> void:
	if _highlight and _highlight.visible != on:
		_highlight.visible = on

## Where the next delivered item should land on the shelf.
func next_slot_position() -> Vector3:
	var index := slots_filled
	var row := (index / SLOT_COLUMNS) % SLOT_ROWS
	var col := index % SLOT_COLUMNS
	var z := -_length * 0.5 + 0.6 + col * ((_length - 1.2) / float(SLOT_COLUMNS - 1))
	var y := 0.34 + row * 0.42
	# Alternate faces so both sides of the unit fill up.
	var side := 1.0 if (index / (SLOT_COLUMNS * SLOT_ROWS)) % 2 == 0 else -1.0
	return global_position + Vector3(side * (_depth * 0.5 + 0.12), y, z)

func accept_slot() -> Vector3:
	var p := next_slot_position()
	slots_filled += 1
	return p

func distance_to(point: Vector3) -> float:
	# Distance to the unit's long axis, so the whole aisle is reachable.
	var local := point - global_position
	var half := _length * 0.5
	var clamped_z: float = clamp(local.z, -half, half)
	var nearest := global_position + Vector3(0, 0, clamped_z)
	return Vector2(point.x - nearest.x, point.z - nearest.z).length()
