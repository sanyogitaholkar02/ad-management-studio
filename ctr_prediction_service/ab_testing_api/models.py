from django.db import models

# Create your models here.

class ExperimentLog(models.Model):
    user_id = models.CharField(max_length=100, db_index=True)
    experiment_key = models.CharField(max_length=100, db_index=True)
    variant = models.CharField(max_length=10)
    model_version = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user_id"]),
            models.Index(fields=["experiment_key"]),
        ]