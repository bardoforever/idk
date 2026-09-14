extends CanvasLayer
class_name HUD
## Warm paper over the 3D shop. The carried list is where you actually
## read what you are holding - the floor is for routing, this is for knowing.

signal joystick_moved(direction: Vector2)

const INK := Color("#2B2620")
const PAPER := Color("#F6F1E7")
const MUTED := Color("#9A9083")
const ACCENT := Color("#C4553B")

var _shift_fill: ColorRect
var _shift_label: Label
var _cash_label: Label
var _combo_label: Label
var _carry_box: VBoxContainer
var _carry_title: Label
var _perf_label: Label
var _toast: Label
var _toast_time := 0.0

func _ready() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	# --- top bar ---
	var top := PanelContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 12
	top.offset_right = -12
	top.offset_top = 12
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = Color("#FFFDF8")
	style.set_corner_radius_all(14)
	style.set_content_margin_all(12)
	style.border_color = Color("#E2D9C9")
	style.set_border_width_all(1)
	top.add_theme_stylebox_override("panel", style)
	root.add_child(top)

	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	top.add_child(col)

	var row := HBoxContainer.new()
	col.add_child(row)

	var money_col := VBoxContainer.new()
	money_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	money_col.add_theme_constant_override("separation", 0)
	row.add_child(money_col)
	money_col.add_child(_small("THIS SHIFT"))
	_cash_label = _big("$0.00", 30)
	money_col.add_child(_cash_label)

	var combo_col := VBoxContainer.new()
	combo_col.alignment = BoxContainer.ALIGNMENT_END
	combo_col.add_theme_constant_override("separation", 0)
	row.add_child(combo_col)
	_combo_label = _big("1.00x", 26)
	_combo_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_combo_label.add_theme_color_override("font_color", MUTED)
	combo_col.add_child(_combo_label)

	# --- shift clock ---
	var clock_row := HBoxContainer.new()
	clock_row.add_theme_constant_override("separation", 8)
	col.add_child(clock_row)

	var track := PanelContainer.new()
	track.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	track.custom_minimum_size = Vector2(0, 12)
	var track_style := StyleBoxFlat.new()
	track_style.bg_color = Color("#EDE5D6")
	track_style.set_corner_radius_all(6)
	track.add_theme_stylebox_override("panel", track_style)
	clock_row.add_child(track)

	var fill_wrap := Control.new()
	track.add_child(fill_wrap)
	_shift_fill = ColorRect.new()
	_shift_fill.color = ACCENT
	_shift_fill.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	_shift_fill.offset_right = 0
	fill_wrap.add_child(_shift_fill)

	_shift_label = _small("3:00")
	_shift_label.custom_minimum_size = Vector2(44, 0)
	_shift_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	clock_row.add_child(_shift_label)

	# --- what you are holding ---
	var carry_panel := PanelContainer.new()
	carry_panel.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	carry_panel.offset_right = -12
	carry_panel.offset_left = -170
	carry_panel.offset_top = -120
	carry_panel.offset_bottom = 120
	carry_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var cstyle := StyleBoxFlat.new()
	cstyle.bg_color = Color(1, 0.99, 0.97, 0.88)
	cstyle.set_corner_radius_all(12)
	cstyle.set_content_margin_all(10)
	carry_panel.add_theme_stylebox_override("panel", cstyle)
	root.add_child(carry_panel)

	_carry_box = VBoxContainer.new()
	_carry_box.add_theme_constant_override("separation", 3)
	carry_panel.add_child(_carry_box)
	_carry_title = _small("ARMS EMPTY")
	_carry_box.add_child(_carry_title)

	# --- toast ---
	_toast = _big("", 20)
	_toast.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_toast.offset_top = 150
	_toast.offset_left = -180
	_toast.offset_right = 180
	_toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast.add_theme_color_override("font_color", ACCENT)
	_toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_toast)

	# --- performance probe ---
	_perf_label = _small("")
	_perf_label.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	_perf_label.offset_left = 14
	_perf_label.offset_top = -30
	_perf_label.add_theme_color_override("font_color", MUTED)
	root.add_child(_perf_label)

	# --- the thumb pad: lower 45% of the screen ---
	var stick := Joystick.new()
	stick.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	stick.offset_top = -0.45 * ProjectSettings.get_setting("display/window/size/viewport_height")
	stick.moved.connect(func(d: Vector2) -> void: joystick_moved.emit(d))
	root.add_child(stick)

func _small(text: String) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", 11)
	l.add_theme_color_override("font_color", MUTED)
	return l

func _big(text: String, size: int) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", INK)
	return l

func set_cash(cents: int) -> void:
	_cash_label.text = "$%0.2f" % (cents / 100.0)

func set_combo(multiplier: float) -> void:
	_combo_label.text = "%0.2fx" % multiplier
	_combo_label.add_theme_color_override("font_color", ACCENT if multiplier > 1.0 else MUTED)

func set_shift(remaining: float, total: float) -> void:
	var ratio: float = clamp(remaining / total, 0.0, 1.0)
	var parent_width: float = _shift_fill.get_parent().size.x
	_shift_fill.offset_right = -parent_width * (1.0 - ratio)
	_shift_fill.color = Color("#B4544A") if ratio < 0.2 else ACCENT
	_shift_label.text = "%d:%02d" % [int(remaining) / 60, int(remaining) % 60]

func set_carried(names: Array, capacity: int) -> void:
	for child in _carry_box.get_children():
		if child != _carry_title:
			child.queue_free()
	if names.is_empty():
		_carry_title.text = "ARMS EMPTY"
		return
	_carry_title.text = "CARRYING %d/%d" % [names.size(), capacity]
	for n in names:
		var l := Label.new()
		l.text = String(n)
		l.add_theme_font_size_override("font_size", 13)
		l.add_theme_color_override("font_color", INK)
		l.autowrap_mode = TextServer.AUTOWRAP_OFF
		l.clip_text = true
		_carry_box.add_child(l)

func set_perf(fps: float, loose_items: int, drawn: int) -> void:
	_perf_label.text = "%d fps · %d on floor · %d objects" % [fps, loose_items, drawn]

func toast(text: String) -> void:
	_toast.text = text
	_toast_time = 1.1

func _process(delta: float) -> void:
	if _toast_time > 0.0:
		_toast_time -= delta
		_toast.modulate.a = clamp(_toast_time / 0.5, 0.0, 1.0)
		if _toast_time <= 0.0:
			_toast.text = ""
