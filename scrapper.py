from datetime import datetime, timezone
from datas import REQUESTED_CONTAINERS
import requests
import os

def get_case_data():
    all_items = []
    start = 0
    count = 100

    while True:
        params = {
            "appid": "730",
            "q": "Case",
            "norender": "1",
            "count": count,
            "start": start,
            "category_730_Type[]": "tag_CSGO_Type_WeaponCase"
        }
        headers = {
            "User-Agent": "Mozilla/5.0"
        }

        response = requests.get("https://steamcommunity.com/market/search/render/", params=params, headers=headers)
        if response.status_code == 200:
            data = response.json()
            items = data.get('results', [])
            total_count = data.get('total_count', 0)

            # Add the fetched items to our master list
            all_items.extend(items)

            # If we've retrieved all items or the last fetch returned less than 'count' items, break
            if len(all_items) >= total_count or len(items) < count:
                break

            # Increment start for the next page
            start += count
        else:
            print(f"Error: Received status code {response.status_code}")
            break

    return all_items

def scrap_update():
    # Get case data
    case_data=get_case_data()

    # Data for the run
    date=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Iterate over cases
    for case in case_data:
        name=case["name"]
        # Check if its really a wanted case
        if name in REQUESTED_CONTAINERS:
            listings=case["sell_listings"]
            sell_price=case["sell_price_text"]
            buy_price=case["sale_price_text"]

            # Write the data to a file
            file_name=name.lower().replace(" ", "_").replace(":", "_")
            file_path=os.path.join(script_dir, "data", f"{file_name}.csv")

            # if first time processing data
            if not os.path.exists(file_path):
                with open(file_path, "w") as f:
                    f.write(f"Date,Listings,Sell Price,Buy Price\n")

            data_line=f"{date},{listings},{sell_price},{buy_price}"
            with open(file_path, "a") as f:
                f.write(f"{data_line}\n")
