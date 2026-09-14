extends CharacterBody3D
class_name Player
## Top-down character. One thumb drives it; nothing else is needed to play.

var move_direction := Vector2.ZERO   ## set by the joystick, length 0..1
var carry_anchor: Vector3:
	get: return global_position + Vector3(0, 1.05, 0)

var _body: MeshInstance3D

func _ready() -> void:
	var col := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.38
	capsule.height = 1.5
	col.shape = capsule
	col.position = Vector3(0, 0.75, 0)
	add_child(col)

	_body = MeshInstance3D.new()
	var mesh := CapsuleMesh.new()
	mesh.radius = 0.38
	mesh.height = 1.5
	_body.mesh = mesh
	var m := StandardMaterial3D.new()
	m.albedo_color = Color("#2F6F8F")
	m.roughness = 0.9
	m.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	_body.material_override = m
	_body.position = Vector3(0, 0.75, 0)
	add_child(_body)

	# A nose, so you can tell which way you are facing from above.
	var nose := MeshInstance3D.new()
	var nm := BoxMesh.new()
	nm.size = Vector3(0.18, 0.18, 0.3)
	nose.mesh = nm
	var nmat := StandardMaterial3D.new()
	nmat.albedo_color = Color("#F6F1E7")
	nmat.specular_mode = BaseMaterial3D.SPECULAR_DISABLED
	nose.material_override = nmat
	nose.position = Vector3(0, 1.0, -0.42)
	add_child(nose)

func _physics_process(delta: float) -> void:
	var wish := Vector3(move_direction.x, 0.0, move_direction.y) * Cfg.MOVE_SPEED
	if wish.length() > 0.01:
		velocity = velocity.move_toward(wish, Cfg.ACCEL * delta)
		# Face where you are going.
		var target_yaw := atan2(-wish.x, -wish.z)
		rotation.y = lerp_angle(rotation.y, target_yaw, clamp(delta * 12.0, 0.0, 1.0))
	else:
		velocity = velocity.move_toward(Vector3.ZERO, Cfg.FRICTION * delta)
	velocity.y = 0.0
	move_and_slide()
