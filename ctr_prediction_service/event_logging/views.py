from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ImpressionLog, ClickLog


@api_view(["POST"])
def log_impression(request):
    data = request.data
    ImpressionLog.objects.create(
        user_id=data["user_id"],
        ad_id=data["ad_id"],
        experiment_key=data["experiment_key"],
        variant=data["variant"]
    )
    return Response({"status": "logged"})

@api_view(["POST"])
def log_click(request):
    data = request.data
    ClickLog.objects.create(
        user_id=data["user_id"],
        ad_id=data["ad_id"],
        experiment_key=data["experiment_key"],
        variant=data["variant"]
    )
    return Response({"status": "logged"})
