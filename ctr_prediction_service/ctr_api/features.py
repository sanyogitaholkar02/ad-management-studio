DAY_MAP = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
    "Friday": 4, "Saturday": 5, "Sunday": 6,
}

DEVICE_MAP = {
    "mobile": 0, "tablet": 1, "desktop": 2,
}


def build_feature_vector(profile, context):
    """
    Build a numeric feature vector from the user profile and context.

    Features (12-element vector):
        0 - number of interests
        1 - number of search history items
        2 - number of preferred topics
        3 - average price preference (0 if none)
        4 - number of influencers followed
        5 - number of current interests
        6 - number of recent ads
        7 - average CTR rate from recent ads (0 if none)
        8 - ratio of relevant recent ads (0 if none)
        9 - device type (encoded)
       10 - hour of day (from time_of_day)
       11 - day of week (encoded)
    """

    # Profile features
    recent_ads = profile.get("recent_ads", [])
    price_prefs = profile.get("price_preferences", [])

    num_interests = len(profile.get("interests", []))
    num_search_history = len(profile.get("search_history", []))
    num_preferred_topics = len(profile.get("preferred_topics", []))
    avg_price = sum(price_prefs) / len(price_prefs) if price_prefs else 0
    num_influencers = len(profile.get("influencers_followed", []))
    num_current_interests = len(profile.get("current_interests", []))
    num_recent_ads = len(recent_ads)

    avg_ctr = (
        sum(ad["ctr_rate"] for ad in recent_ads) / len(recent_ads)
        if recent_ads else 0
    )
    relevant_ratio = (
        sum(1 for ad in recent_ads if ad["is_relevant"]) / len(recent_ads)
        if recent_ads else 0
    )

    # Context features
    device_type = DEVICE_MAP.get(context.get("device_type", ""), 0)

    time_str = context.get("time_of_day", "12:00")
    try:
        hour = int(time_str.split(":")[0])
    except (ValueError, IndexError):
        hour = 12

    day_of_week = DAY_MAP.get(context.get("day_of_week", ""), 3)

    return [
        num_interests,
        num_search_history,
        num_preferred_topics,
        avg_price,
        num_influencers,
        num_current_interests,
        num_recent_ads,
        avg_ctr,
        relevant_ratio,
        device_type,
        hour,
        day_of_week,
    ]