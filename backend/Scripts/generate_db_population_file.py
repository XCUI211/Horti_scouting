import json
from pathlib import Path
from collections import OrderedDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MAPS_DIR = BASE_DIR / "frontend" / "src" / "components" / "AllMaps"
OUTPUT_FILE = BASE_DIR / "backend" / "Database" / "populate_database.sql"

MAP_CONFIG = [{"map_name": "Rijsenhout",
               "json_file": "rijsenhout.json",
               "exclude": ["Rijsenhout", "Oppotruimte", "Raap plein", "Magazijn", "KAS 2", "KAS 3", "KAS 4"]},

              {"map_name": "HW 53",
               "json_file": "hw53.json",
               "exclude": ["HW 53", "water ruimte", "schuur/ketelhuis", "wkk/kunstmest unit", "21"]},

              {"map_name": "HW 10.12",
               "json_file": "hw10.12.json",
               "exclude": ["Tranportbaan", "Transport", "Deur naar kas 2", "Deur naar kas 3", "1100", "Piramides", "Bakken"]},

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
               "exclude": []}]

def load_json(path: Path):
    with path.open(encoding="utf-8") as file:
        return json.load(file)

# This function ensures that single quotes are turned into two single quotes to prevent SQL errors
def sql_quote(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"

# This function converts a Python object to a JSON string and formats it for SQL insertion as jsonb
def json_to_sql(obj) -> str:
    return "'" + json.dumps(obj).replace("'", "''") + "'::jsonb"

# This function extracts unique, non-empty, non-excluded (as above) labels from the grid in the order they appear
def extract_clickable_cells(grid, exclude):
    seen = OrderedDict()
    exclude_set = set(exclude)

    # Go through the grid row by row, cell by cell, and collect unique labels while preserving order
    for row in grid:
        for cell in row:
            if cell is None or cell == "":
                continue

            label = str(cell).strip()
            if not label:
                continue

            if label in exclude_set:
                continue

            seen.setdefault(label, None)

    return list(seen.keys())

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
            f"VALUES ({sql_quote(map_name)}, '', '', {json_to_sql(grid)}) "
            f"ON CONFLICT (name) DO UPDATE "
            f"SET json_map = EXCLUDED.json_map;"
        )

    lines.append("")

    # POPULATING FLOORS
    lines.append("-- ========== FLOORS ==========")
    total_labels = 0
    for cfg in MAP_CONFIG:
        map_name = cfg["map_name"]
        json_file = cfg["json_file"]
        json_path = MAPS_DIR / json_file
        exclude = cfg.get("exclude", [])

        if not json_path.exists():
            lines.append(f"-- WARNING: missing JSON for {map_name} floors (skipping)")
            continue

        grid = load_json(json_path)
        labels = extract_clickable_cells(grid, exclude)

        lines.append(f"-- {map_name}")
        for label in labels:
            lines.append(
                "INSERT INTO floors (mid, name, plant_name) "
                f"SELECT m.mid, {sql_quote(label)}, {sql_quote('Unknown')} "
                "FROM maps m "
                f"WHERE m.name = {sql_quote(map_name)} "
                "AND NOT EXISTS ("
                "SELECT 1 FROM floors f WHERE f.mid = m.mid AND f.name = "
                f"{sql_quote(label)}"
                ");"
            )
            total_labels += 1
        lines.append("")

    lines.append("COMMIT;")

    OUTPUT_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUTPUT_FILE}")
    print(f"  Maps: {len([c for c in MAP_CONFIG if (MAPS_DIR / c['json_file']).exists()])}")
    print(f"  Floors: {total_labels} labels")

if __name__ == "__main__":
    main()

