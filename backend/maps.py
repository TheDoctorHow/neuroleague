import googlemaps
from config import settings

gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY) if settings.GOOGLE_MAPS_API_KEY else None

def get_nearby_venues(lat: float, lng: float, skill: str):
    if not gmaps:
        return []
        
    query_map = {
        "music": "music studio OR recording studio OR cafe live music",
        "crypto": "co-working space OR cafe fast wifi OR financial district",
        "coding": "library OR tech space OR developer cafe"
    }
    
    query = query_map.get(skill, "cafe")
    
    try:
        places_result = gmaps.places(
            query=query,
            location=(lat, lng),
            radius=5000 # 5km
        )
        
        venues = []
        for place in places_result.get("results", [])[:5]:
            venue = {
                "name": place.get("name"),
                "address": place.get("formatted_address"),
                "lat": place["geometry"]["location"]["lat"],
                "lng": place["geometry"]["location"]["lng"],
                "rating": place.get("rating", 0.0),
                "place_id": place.get("place_id"),
                "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id')}"
            }
            venues.append(venue)
        return venues
    except Exception as e:
        print(f"Places error: {e}")
        return []

def get_neighborhood(lat: float, lng: float):
    if not gmaps:
        return "Unknown Location"
    try:
        reverse_geocode_result = gmaps.reverse_geocode((lat, lng))
        for result in reverse_geocode_result:
            for component in result["address_components"]:
                if "neighborhood" in component["types"]:
                    return component["long_name"]
                if "sublocality" in component["types"] or "sublocality_level_1" in component["types"]:
                    return component["long_name"]
        
        # Fallback to city
        for result in reverse_geocode_result:
            for component in result["address_components"]:
                if "locality" in component["types"]:
                    return component["long_name"]
                    
        return "Unknown Area"
    except Exception as e:
        print(f"Geocoding error: {e}")
        return "Unknown Area"

def suggest_meetup_venue(lat1: float, lng1: float, lat2: float, lng2: float, skill: str):
    mid_lat = (lat1 + lat2) / 2
    mid_lng = (lng1 + lng2) / 2
    venues = get_nearby_venues(mid_lat, mid_lng, skill)
    return venues[:3]
