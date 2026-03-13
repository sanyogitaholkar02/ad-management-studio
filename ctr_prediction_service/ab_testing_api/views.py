from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from ab_testing_api.serializers import ExperimentAssignSerializer
from .services.experiment_service import assign_variant, log_experiment_assignment
from django.http import JsonResponse

def get_variant(request):
    return JsonResponse({"variant": "B"})

@api_view(["POST"])
def assign_experiment(request):
    serializer = ExperimentAssignSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_id = serializer.validated_data["user_id"]
    experiment_key = serializer.validated_data["experiment_key"]

    result = assign_variant(user_id, experiment_key)

    if not result:
        return Response(
            {"error": f"Experiment {experiment_key} not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Log assignment
    log_experiment_assignment(
        user_id=user_id,
        experiment_key=experiment_key,
        variant=result["variant"],
        model_version=result["model_version"]
    )

    return Response({
        "experiment_key": experiment_key,
        "variant": result["variant"],
        "model_version": result["model_version"]
    })
'''
Think of A/B testing like:traffic router
It decides:which users see which algorithm


Using hashing ensures:same user → always same variant
This avoids:User sees different models every request
'''

'''
Production Improvements / Notes

Deterministic assignment → ensures stable user experience

Logging → experiment metrics can be computed later (CTR per variant)

Indexed DB → fast queries for analytics

Multiple experiments → can add more keys in EXPERIMENTS

Traffic splits → percentages are configurable per variant

Can integrate with CTR API → pass model_version returned from this API to ctr_api/predict'''

'''
POST /experiment/assign
{
  "user_id": "user_123",
  "experiment_key": "ctr_model_test"
}
Response
{
  "experiment_key": "ctr_model_test",
  "variant": "B",
  "model_version": "ctr_model_v2"
}'''

'''
User request → Ad-Service
     ↓
POST /experiment/assign → ab_testing_api
     ↓
Returns variant + model_version
     ↓
POST /ctr/predict → ctr_api
     ↓
Prediction logged'''