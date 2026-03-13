"""
Ad catalog service — maps user interests to relevant ad candidates.
"""

# In-memory ad catalog (in production this would come from a database or the Spring ad-service)
AD_CATALOG = [
    {"ad_id": "ad_101", "title": "Nike Shoes", "category": "Footwear", "keywords": ["shoes", "sneakers", "footwear", "nike"]},
    {"ad_id": "ad_102", "title": "Cricket Bat", "category": "Sports", "keywords": ["bat", "cricket", "sports"]},
    {"ad_id": "ad_103", "title": "Sports Cap", "category": "Accessories", "keywords": ["cap", "hat", "accessories"]},
    {"ad_id": "ad_104", "title": "Running Shoes", "category": "Footwear", "keywords": ["shoes", "running", "fitness"]},
    {"ad_id": "ad_105", "title": "Yoga Mat", "category": "Fitness", "keywords": ["yoga", "fitness", "exercise"]},
    {"ad_id": "ad_106", "title": "Dance Shoes", "category": "Footwear", "keywords": ["dance", "shoes", "performance"]},
    {"ad_id": "ad_107", "title": "Cricket Jersey", "category": "Apparel", "keywords": ["cricket", "jersey", "match", "players"]},
    {"ad_id": "ad_108", "title": "Sports Watch", "category": "Accessories", "keywords": ["watch", "sports", "fitness"]},
    {"ad_id": "ad_109", "title": "YouTube Premium", "category": "Subscription", "keywords": ["youtube", "video", "streaming"]},
    {"ad_id": "ad_110", "title": "Instagram Ads", "category": "Social Media", "keywords": ["instagram", "social", "influencer"]},
]


def match_ads_to_interests(profile, max_ads=5):
    """
    Match ads from the catalog to the user's interests, search history,
    preferred topics, current interests, and influencers followed.

    Returns a list of matched ads sorted by relevance score (highest first).
    """
    # Collect all user signals into a single set of keywords (lowercase)
    user_keywords = set()
    for field in ["interests", "search_history", "preferred_topics",
                  "current_interests", "influencers_followed"]:
        for item in profile.get(field, []):
            user_keywords.add(item.lower())

    scored_ads = []
    for ad in AD_CATALOG:
        ad_keywords = set(kw.lower() for kw in ad["keywords"])
        overlap = user_keywords & ad_keywords
        if overlap:
            scored_ads.append({
                "ad_id": ad["ad_id"],
                "title": ad["title"],
                "category": ad["category"],
                "relevance_score": len(overlap),
            })

    # Sort by relevance (most keyword matches first), then by ad_id for stability
    scored_ads.sort(key=lambda x: (-x["relevance_score"], x["ad_id"]))

    return scored_ads[:max_ads]
