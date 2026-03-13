from django.db import models


class PredictionLog(models.Model):

    request_id = models.CharField(max_length=100, db_index=True)
    user_id = models.CharField(max_length=100, db_index=True)
    ad_id = models.CharField(max_length=100)

    predicted_ctr = models.FloatField()
    model_version = models.CharField(max_length=50)

    latency_ms = models.IntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["request_id"]),
        ]