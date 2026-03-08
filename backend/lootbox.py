import random
from cosmetics import COSMETICS_CATALOG

DROP_RATES = {
    "bronze": {"common": 0.70, "uncommon": 0.25, "rare": 0.05, "legendary": 0.0},
    "silver": {"common": 0.30, "uncommon": 0.45, "rare": 0.20, "legendary": 0.05},
    "gold":   {"common": 0.0,  "uncommon": 0.30, "rare": 0.45, "legendary": 0.25}
}

def roll_rarity(tier: str) -> str:
    rates = DROP_RATES.get(tier.lower(), DROP_RATES["bronze"])
    rand = random.random()
    cumulative = 0.0
    for rarity, prob in rates.items():
        if prob == 0:
            continue
        cumulative += prob
        if rand <= cumulative:
            return rarity
    return "common"

def get_random_item(skill: str, rarity: str, allow_cross_track: bool = False):
    pool = []
    # Add items from the user's skill track
    if skill in COSMETICS_CATALOG:
        for item_type, items in COSMETICS_CATALOG[skill].items():
            for item in items:
                if item["rarity"] == rarity:
                    pool.append({"type": item_type, **item})
    
    # Add cross-track items if allowed and we are rolling for legendary
    if allow_cross_track and rarity == "legendary":
        for item_type, items in COSMETICS_CATALOG["Cross-Track"].items():
            for item in items:
                pool.append({"type": item_type, **item})
                
    if not pool:
        return None
    return random.choice(pool)
