import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MAPS_DIR = BASE_DIR / "frontend" / "src" / "components" / "AllMaps"
OUTPUT_FILE = BASE_DIR / "backend" / "Database" / "populate_database.sql"

# split_slot_codes is used for maps where the frontend renders adjacent slot-code cells as separate clickable cells.
MAP_CONFIG = [{"map_name": "Rijsenhout",
               "json_file": "rijsenhout.json",
               "exclude": ["Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4"]},

              {"map_name": "HW 53",
               "json_file": "hw53.json",
               "exclude": ["HW 53", "water ruimte", "schuur/ketelhuis", "wkk/kunstmest unit", "21"]},

              {"map_name": "HW 10.11",
               "json_file": "hw10.11.json",
               "exclude": [],
               "split_slot_codes": True},

              {"map_name": "HW 10.12",
               "json_file": "hw10.12.json",
               "exclude": ["Tranportbaan", "Transport", "Deur naar kas 2", "Deur naar kas 3", "1100", "Piramides", "Bakken"]},

              {"map_name": "HW 10.13",
               "json_file": "hw10.13.json",
               "exclude": [],
               "split_slot_codes": True},

              {"map_name": "HW 10.14",
               "json_file": "hw10.14.json",
               "exclude": []},

              {"map_name": "HW 10.15",
               "json_file": "hw10.15.json",
               "exclude": ["Schuur", "Deur naar 1600", "1300"]},

              {"map_name": "HW 10.16",
               "json_file": "hw10.16.json",
               "exclude": ["Deur naar 1500", "Deur naar 1700"]},

              {"map_name": "HW 10.17",
               "json_file": "hw10.17.json",
               "exclude": ["Deur naar 1600", "Deur "]},

              {"map_name": "HW 15",
               "json_file": "hw.15.json",
               "exclude": []},

              {"map_name": "HW 13",
               "json_file": "hw_13.json",
               "exclude": ["PAD", "VERWERKINGSHAL", "Plattegrond HW13", "Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4"]},

              {"map_name": "HW 29",
               "json_file": "hw_29.json",
               "exclude": ["PAD", "VERWERKINGSHAL", "Plattegrond HW29", "Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4", "silo", "ketel", "wkk", "water ruimte"]},

              {"map_name": "Legmeerdijk",
               "json_file": "leg.json",
               "exclude": ["PAD", "VERWERKINGSHAL", "Legmeerdijk", "Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4", "silo", "ketel", "wkk", "water ruimte", "Afdeling 3", "Afdeling 4", "Afdeling 2.2", "Afdeling 2.1", "Ketel en WWK", "WC", "Verwerkingshal // Buffer", "kantine"]}]


def load_json(path: Path):
    with path.open(encoding="utf-8") as file:
        return json.load(file)

# This function ensures that single quotes are turned into two single quotes to prevent SQL errors
def sql_quote(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"

# This function converts a Python object to a JSON string and formats it for SQL insertion as jsonb
def json_to_sql(obj) -> str:
    return "'" + json.dumps(obj).replace("'", "''") + "'::jsonb"

def is_slot_code(label: str) -> bool:
    return bool(re.search(r"^\d", label) and re.search(r"[A-Za-z]", label))


# Extracts one database floor row per clickable block rendered on the map. Adjacent identical JSON cells are normally
# merged into one block; split_slot_codes prevents merging for labels like "1P1" on maps where the frontend splits them.
def extract_clickable_blocks(grid, exclude, map_name, split_slot_codes=False):
    blocks = []
    rendered = set()
    exclude_set = set(exclude)

    for row_idx, row in enumerate(grid):
        for col_idx, cell in enumerate(row):
            if (row_idx, col_idx) in rendered:
                continue

            if cell is None or cell == "":
                continue

            label = str(cell).strip()
            if not label:
                continue

            width = 1
            height = 1
            if not (split_slot_codes and is_slot_code(label)):
                while col_idx + width < len(row) and row[col_idx + width] == cell:
                    width += 1

                while row_idx + height < len(grid):
                    next_row = grid[row_idx + height]
                    next_row_matches = all(
                        col_idx + offset < len(next_row) and next_row[col_idx + offset] == cell
                        for offset in range(width)
                    )
                    if not next_row_matches:
                        break
                    height += 1

            for r in range(row_idx, row_idx + height):
                for c in range(col_idx, col_idx + width):
                    rendered.add((r, c))

            if label in exclude_set:
                continue

            blocks.append({
                "label": label,
                "block_key": f"{map_name}::{label}::{row_idx}:{col_idx}",
            })

    return blocks

# Main function to generate the SQL population file
def main():
    lines = []
    lines.append("BEGIN;")
    lines.append("")

    # POPULATING MAPS
    lines.append("-- ========== MAPS ==========")
    for cfg in MAP_CONFIG:
        map_name = cfg["map_name"]
        json_file = cfg["json_file"]
        json_path = MAPS_DIR / json_file

        if not json_path.exists():
            lines.append(f"-- WARNING: missing JSON for {map_name} (skipping)")
            continue

        grid = load_json(json_path)

        lines.append(f"-- {map_name}")
        lines.append(
            f"INSERT INTO maps (name, location, greenhouse, json_map) "
            f"VALUES ({sql_quote(map_name)}, '', '', {json_to_sql(grid)});"
        )

    lines.append("")

    # POPULATING FLOORS
    lines.append("-- ========== FLOORS ==========")
    total_blocks = 0
    for cfg in MAP_CONFIG:
        map_name = cfg["map_name"]
        json_file = cfg["json_file"]
        json_path = MAPS_DIR / json_file
        exclude = cfg.get("exclude", [])

        if not json_path.exists():
            lines.append(f"-- WARNING: missing JSON for {map_name} floors (skipping)")
            continue

        grid = load_json(json_path)
        blocks = extract_clickable_blocks(grid, exclude, map_name, cfg.get("split_slot_codes", False))

        lines.append(f"-- {map_name}")
        for block in blocks:
            label = block["label"]
            block_key = block["block_key"]
            lines.append(
                "INSERT INTO floors (mid, name, block_key) "
                f"SELECT m.mid, {sql_quote(label)}, {sql_quote(block_key)} "
                "FROM maps m "
                f"WHERE m.name = {sql_quote(map_name)};"
            )
            total_blocks += 1
        lines.append("")

    lines.append("COMMIT;")

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE}")
    print(f"  Maps: {len([c for c in MAP_CONFIG if (MAPS_DIR / c['json_file']).exists()])}")
    print(f"  Floors: {total_blocks} clickable blocks")

if __name__ == "__main__":
    main()
