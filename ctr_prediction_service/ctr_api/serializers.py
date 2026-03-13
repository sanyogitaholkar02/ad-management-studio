from rest_framework import serializers


class RecentAdSerializer(serializers.Serializer):
    ad_id = serializers.CharField()
    is_relevant = serializers.BooleanField()
    ctr_rate = serializers.FloatField()


class ProfileSerializer(serializers.Serializer):
    age_group = serializers.CharField()
    interests = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    search_history = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    preferred_topics = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    background_info = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    price_preferences = serializers.ListField(child=serializers.FloatField(), required=False, default=[])
    influencers_followed = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    current_interests = serializers.ListField(child=serializers.CharField(), required=False, default=[])
    recent_ads = RecentAdSerializer(many=True, required=False, default=[])


class ContextSerializer(serializers.Serializer):
    device_type = serializers.CharField()
    country = serializers.CharField()
    currency = serializers.CharField(required=False, default="USD")
    time_of_day = serializers.CharField()
    day_of_week = serializers.CharField()


class CTRRequestSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    profile = ProfileSerializer()
    context = ContextSerializer()