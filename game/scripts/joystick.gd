extends Control
class_name Joystick
## A floating stick: press anywhere in the pad and the base appears under
## your thumb, so there is nothing to aim for and no fixed corner to reach.

signal moved(direction: Vector2)

const RADIUS := 90.0
const DEAD_ZONE := 0.12

var _touch_index := -1
var _base := Vector2.ZERO
var _knob := Vector2.ZERO
var _active := false

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP

func _gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and _touch_index == -1:
			_touch_index = event.index
			_begin(event.position)
		elif not event.pressed and event.index == _touch_index:
			_end()
		accept_event()
	elif event is InputEventScreenDrag and event.index == _touch_index:
		_drag(event.position)
		accept_event()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_touch_index = -2
			_begin(event.position)
		else:
			_end()
		accept_event()
	elif event is InputEventMouseMotion and _touch_index == -2:
		_drag(event.position)
		accept_event()

func _begin(pos: Vector2) -> void:
	_active = true
	_base = pos
	_knob = pos
	queue_redraw()

func _drag(pos: Vector2) -> void:
	_knob = pos
	var offset := (_knob - _base).limit_length(RADIUS)
	_knob = _base + offset
	var dir := offset / RADIUS
	if dir.length() < DEAD_ZONE:
		dir = Vector2.ZERO
	moved.emit(dir)
	queue_redraw()

func _end() -> void:
	_touch_index = -1
	_active = false
	moved.emit(Vector2.ZERO)
	queue_redraw()

func _draw() -> void:
	if not _active:
		return
	draw_circle(_base, RADIUS, Color(0.17, 0.15, 0.13, 0.10))
	draw_arc(_base, RADIUS, 0, TAU, 48, Color(0.17, 0.15, 0.13, 0.18), 2.0, true)
	draw_circle(_knob, 34.0, Color(0.77, 0.33, 0.23, 0.55))
