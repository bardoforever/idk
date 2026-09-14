extends Node
## The shop's stock, loaded once from data/catalog.json.
## Ported straight from the TypeScript build - same 212 items, same
## deliberate collisions (Vinyl Eraser is a brush, Acetate Disc is a record).

var sections: Array = []
var items: Array = []
var section_by_key: Dictionary = {}
var items_by_section: Dictionary = {}
var _shelf_sections: Array = []

func _ready() -> void:
	var f := FileAccess.open("res://data/catalog.json", FileAccess.READ)
	if f == null:
		push_error("catalog.json missing")
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("catalog.json did not parse")
		return

	sections = parsed.get("sections", [])
	items = parsed.get("items", [])

	for s in sections:
		section_by_key[s["key"]] = s
		items_by_section[s["key"]] = []
		if s.get("scoring", false):
			_shelf_sections.append(s["key"])
	for i in items:
		if items_by_section.has(i["section"]):
			items_by_section[i["section"]].append(i)

func shelf_sections() -> Array:
	return _shelf_sections

func section_color(key: String) -> Color:
	var s: Variant = section_by_key.get(key)
	return Color(s["color"]) if s else Color.WHITE

func section_name(key: String) -> String:
	var s: Variant = section_by_key.get(key)
	return String(s["short"]) if s else key

## A weighted draw: premium stock is rare, break items turn up now and then.
func random_item(rng: RandomNumberGenerator, break_chance: float = 0.08) -> Dictionary:
	if rng.randf() < break_chance and not items_by_section.get("backroom", []).is_empty():
		var breaks: Array = items_by_section["backroom"]
		return breaks[rng.randi() % breaks.size()]

	var key: String = _shelf_sections[rng.randi() % _shelf_sections.size()]
	var pool: Array = items_by_section[key]
	# 10:1 common to premium.
	for attempt in 3:
		var candidate: Dictionary = pool[rng.randi() % pool.size()]
		if candidate["rarity"] != "premium" or rng.randf() < 0.1:
			return candidate
	return pool[rng.randi() % pool.size()]

func item_value(item: Dictionary) -> int:
	return Cfg.VALUE_PREMIUM if item["rarity"] == "premium" else Cfg.VALUE_COMMON
