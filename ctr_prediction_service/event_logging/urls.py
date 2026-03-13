from django.urls import path
from .views import log_impression, log_click

urlpatterns = [
    path("log/impression", log_impression),
    path("log/click", log_click),
]