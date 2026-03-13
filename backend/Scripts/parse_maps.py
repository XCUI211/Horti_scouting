import csv
import json
import os

def parse_nursery_csv(file_path):
    """
    Parses a nursery CSV file and converts it into a 2D array.
    """
    grid_data = []
    
    # Check if the file exists to prevent script crashes
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return None

    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.reader(file)
        for row in reader:
            # Logic: Trim whitespace and convert empty cells to None
            grid_data.append([cell.strip() if cell.strip() else None for cell in row])
    return grid_data

if __name__ == "__main__":
    # Get the absolute path of the current script directory (backend/scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construct path to the maps folder (up one level to backend/, then into maps/)
    # Ensure the filename matches exactly with the file in backend/maps/
    map_file_path = os.path.join(script_dir, '..', 'maps', 'Plattegrond HW 10.1.csv')

    print(f"Target Path: {map_file_path}")
    print("Parsing HW 10.1 Layout...")

    data = parse_nursery_csv(map_file_path) 
    
    if data:
        # Print the first three rows to verify the parsing logic
        print(json.dumps(data[:3], indent=2)) 
        print("\nSuccessfully parsed the map!")