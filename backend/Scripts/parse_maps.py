import csv
import json
import os

def parse_nursery_csv(file_path):
    """
    Parses a nursery CSV file into a json file.
    """
    grid_data = []
    
    if not os.path.exists(file_path):
        print(f"File not found")
        return None

    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.reader(file)
        for row in reader:
            grid_data.append([cell.strip() if cell.strip() else None for cell in row])
    return grid_data

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))

    map_file_path = os.path.join(script_dir, '..', 'maps', 'Plattegrond HW 10.1.csv')

    data = parse_nursery_csv(map_file_path) 
    