from rest_framework import serializers


class ExperimentAssignSerializer(serializers.Serializer):

    user_id = serializers.CharField()
    experiment_key = serializers.CharField()