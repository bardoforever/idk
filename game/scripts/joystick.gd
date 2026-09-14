extends Control
class_name Joystick
## One thumb does everything: DRAG to run, TAP to pick up or put down.
##
## The stick only engages once you have actually dragged, so a quick tap
## falls through to the world as a pick-up. That keeps the whole game on
## one thumb without a second button eating the screen.

signal moved(direction: Vector2)
signal tapped(screen_position: Vector2)

const RADIUS := 90.0
const DEAD_ZONE := 0.12
const TAP_MAX_SECONDS := 0.28   ## longer than this and it is a hold, not a tap
const TAP_MAX_DRIFT := 14.0     ## pixels you may wobble and still count as a tap

var _touch_index := -1
var _base := Vector2.ZERO
var _knob := Vector2.ZERO
var _engaged := false           ## true once it counts as a drag
var _press_time := 0.0
var _press_pos := Vector2.ZERO

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP

func _gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and _touch_index == -1:
			_touch_index = event.index
			_begin(event.position)
		elif not event.pressed and event.index == _touch_index:
			_end(event.position)
		accept_event()
	elif event is InputEventScreenDrag and event.index == _touch_index:
		_drag(event.position)
		accept_event()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			_touch_index = -2
			_begin(event.position)
		else:
			_end(event.position)
		accept_event()
	elif event is InputEventMouseMotion and _touch_index == -2:
		_drag(event.position)
		accept_event()

func _begin(pos: Vector2) -> void:
	_base = pos
	_knob = pos
	_press_pos = pos
	_press_time = Time.get_ticks_msec() / 1000.0
	_engaged = false
	queue_redraw()

func _drag(pos: Vector2) -> void:
	if not _engaged and _press_pos.distance_to(pos) < TAP_MAX_DRIFT:
		return   # still might be a tap; do not start running yet
	_engaged = true
	var offset := (pos - _base).limit_length(RADIUS)
	_knob = _base + offset
	var dir := offset / RADIUS
	if dir.length() < DEAD_ZONE:
		dir = Vector2.ZERO
	moved.emit(dir)
	queue_redraw()

func _end(pos: Vector2) -> void:
	var held := Time.get_ticks_msec() / 1000.0 - _press_time
	var drifted := _press_pos.distance_to(pos)
	if not _engaged and held <= TAP_MAX_SECONDS and drifted <= TAP_MAX_DRIFT:
		# Report in viewport coordinates so the camera can unproject it.
		tapped.emit(pos + global_position)
	_touch_index = -1
	_engaged = false
	moved.emit(Vector2.ZERO)
	queue_redraw()

func _draw() -> void:
	if not _engaged:
		return
	draw_circle(_base, RADIUS, Color(0.17, 0.15, 0.13, 0.10))
	draw_arc(_base, RADIUS, 0, TAU, 48, Color(0.17, 0.15, 0.13, 0.18), 2.0, true)
	draw_circle(_knob, 34.0, Color(0.77, 0.33, 0.23, 0.55))
