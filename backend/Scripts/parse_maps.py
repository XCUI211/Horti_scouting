import openpyxl
import json
import os
from api import SessionLocal, Map

def parse_all_nursery_maps(excel_path, output_dir):
    if not os.path.exists(excel_path):
        print(f"Could not find {excel_path}")
        return

    # Load the workbook
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    os.makedirs(output_dir, exist_ok=True)

    for sheet_name in wb.sheetnames:
        # Skip non-map sheets
        if sheet_name in ['Blad1', 'Blad2', 'Pesticides', 'Legenda plagen']: 
            continue
        
        ws = wb[sheet_name]
        
        temp_max_r = ws.max_row
        temp_max_c = ws.max_column

        # Helper: Check if a column index is truly empty across the whole sheet
        def is_col_empty(col_idx, total_rows):
            # Check for any values in this column
            for r in range(1, total_rows + 1):
                if ws.cell(row=r, column=col_idx).value is not None:
                    return False
            # Check if any merged range covers this column
            for merge_range in ws.merged_cells.ranges:
                min_col, _, max_col, _ = merge_range.bounds
                if min_col <= col_idx <= max_col:
                    return False
            return True

        # Shrink from the right
        actual_max_c = temp_max_c
        while actual_max_c > 0 and is_col_empty(actual_max_c, temp_max_r):
            actual_max_c -= 1

        # Shrink from the bottom
        actual_max_r = temp_max_r
        while actual_max_r > 0:
            row_has_data = any(ws.cell(row=actual_max_r, column=c).value is not None for c in range(1, actual_max_c + 1))
            row_has_merge = any(m.bounds[1] <= actual_max_r <= m.bounds[3] for m in ws.merged_cells.ranges)
            if row_has_data or row_has_merge:
                break
            actual_max_r -= 1

        if actual_max_r == 0 or actual_max_c == 0:
            continue

        # Create the grid based on detected boundaries
        grid = [[None for _ in range(actual_max_c)] for _ in range(actual_max_r)]
        
        # Fill basic data
        for r in range(1, actual_max_r + 1):
            for c in range(1, actual_max_c + 1):
                grid[r-1][c-1] = ws.cell(row=r, column=c).value
        
        # Fill merged data
        for merge_range in ws.merged_cells.ranges:
            min_col, min_row, max_col_range, max_row_range = merge_range.bounds
            top_left_value = ws.cell(row=min_row, column=min_col).value
            
            for r in range(min_row, max_row_range + 1):
                for c in range(min_col, max_col_range + 1):
                    # Only fill if within our trimmed boundaries
                    if r <= actual_max_r and c <= actual_max_c:
                        grid[r-1][c-1] = top_left_value
        
        # Numeric cleanup (1.0 -> 1)
        for r in range(len(grid)):
            for c in range(len(grid[r])):
                val = grid[r][c]
                if isinstance(val, (int, float)) and not isinstance(val, bool):
                    if float(val).is_integer():
                        grid[r][c] = int(val)

        # Save to JSON
        safe_name = sheet_name.replace(" ", "_").lower()
        file_path = os.path.join(output_dir, f"{safe_name}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(grid, f, indent=2)
        
            
    print(f"\n All maps cleaned and saved to: {output_dir}")

if __name__ == "__main__":
    # Setup Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    excel_path = os.path.normpath(os.path.join(script_dir, '..', 'Maps', 'Plattegrond HW 13.xlsx'))
    output_dir = os.path.normpath(os.path.join(script_dir, '..', '..', 'frontend', 'src', 'components', 'AllMaps'))
    
    parse_all_nursery_maps(excel_path, output_dir)

