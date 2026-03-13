from django.urls import path
from .views import get_variant,assign_experiment

urlpatterns = [
    path('variant/', get_variant),
    path("assign/", assign_experiment),
]