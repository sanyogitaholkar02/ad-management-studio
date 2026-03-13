from django.urls import path
from .views import (
    get_data,
    predict_ctr,
    get_model_info,
    get_model_monitoring,
    get_performance_history,
    get_drift_history,
    get_model_registry,
    get_user_predictions,
)

urlpatterns = [
    path('get-data/', get_data),
    path('predict/', predict_ctr),
    path('predict/<str:user_id>/', get_user_predictions),
    path('model/', get_model_info),
    path('model/monitoring/', get_model_monitoring),
    path('model/monitoring/performance/', get_performance_history),
    path('model/monitoring/drift/', get_drift_history),
    path('model/monitoring/registry/', get_model_registry),
]