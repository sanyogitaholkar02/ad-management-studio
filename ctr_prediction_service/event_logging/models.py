from django.db import models

# Create your models here.
class ImpressionLog(models.Model):
    user_id = models.CharField(max_length=100, db_index=True)
    ad_id = models.CharField(max_length=100)
    experiment_key = models.CharField(max_length=100)
    variant = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

class ClickLog(models.Model):
    user_id = models.CharField(max_length=100, db_index=True)
    ad_id = models.CharField(max_length=100)
    experiment_key = models.CharField(max_length=100)
    variant = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)