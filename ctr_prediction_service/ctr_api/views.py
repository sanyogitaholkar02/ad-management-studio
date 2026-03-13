from django.shortcuts import render
import requests
import time
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ctr_api.serializers import CTRRequestSerializer
from ctr_api.features import build_feature_vector
from .services.ctr_model_service import ctr_model_service
from .services.logging_service import log_prediction

def get_data(request):
    spring_url = "http://localhost:8086/api/data"

    response = requests.get(spring_url)

    return JsonResponse(response.json(), safe=False)

def predict_ctr_dummy(request):
    return JsonResponse({"ctr": 0.73})

@api_view(["GET"])
def get_model_info(request):
    return Response({
        "model_version": "v3",
        "trained_on": "2026-02-01"
    })

import json
import os

MONITORING_DIR = os.path.join(os.path.dirname(__file__), "static", "model_monitoring")


def _load_json(filename):
    filepath = os.path.join(MONITORING_DIR, filename)
    with open(filepath, "r") as f:
        return json.load(f)


@api_view(["GET"])
def get_model_monitoring(request):
    performance_history = _load_json("performance_history.json")
    drift_history = _load_json("drift_history.json")
    model_registry = _load_json("model_registry.json")

    # Latest snapshots
    latest_performance = performance_history[-1]
    latest_drift = drift_history[-1]
    active_model = model_registry["models"]["v3"]

    response_data = {
        "model_monitoring": {
            "current_model_version": active_model["version"],
            "training_date": active_model["training_date"],
            "deployed_date": active_model["deployed_date"],
            "dataset_size": active_model["dataset_size"],
            "algorithm": active_model["algorithm"],
            "status": active_model["status"]
        },
        "model_performance": latest_performance["metrics"],
        "drift_detection": {
            "feature_drift": latest_drift["feature_drift"],
            "prediction_drift": latest_drift["prediction_drift"]
        },
        "history": {
            "performance_snapshots": len(performance_history),
            "drift_snapshots": len(drift_history),
            "endpoints": {
                "full_performance_history": "/api/ctr/model/monitoring/performance/",
                "full_drift_history": "/api/ctr/model/monitoring/drift/",
                "model_registry": "/api/ctr/model/monitoring/registry/"
            }
        }
    }

    return Response(response_data)


@api_view(["GET"])
def get_performance_history(request):
    return Response(_load_json("performance_history.json"))

@api_view(["GET"])
def get_drift_history(request):
    return Response(_load_json("drift_history.json"))

@api_view(["GET"])
def get_model_registry(request):
    return Response(_load_json("model_registry.json"))

from .services.ad_catalog_service import match_ads_to_interests
from .services.user_context_service import save_user_context, save_ad_predictions
from ctr_api.db.database import get_db_session
from ctr_api.db.models import UserAdPrediction


@api_view(["GET"])
def get_user_predictions(request, user_id):
    session = get_db_session()
    try:
        # Query user_ad_prediction joined with ad_prediction via relationship
        results = (
            session.query(UserAdPrediction)
            .filter(UserAdPrediction.user_id == user_id)
            .order_by(UserAdPrediction.created_at.desc())
            .all()
        )

        if not results:
            return Response(
                {"message": f"No predictions found for user_id: {user_id}"},
                status=404
            )

        data = []
        for prediction in results:
            data.append({
                "prediction_id": prediction.id,
                "user_id": prediction.user_id,
                "chosen_ad": prediction.chosen_ad,
                "total_latency_ms": prediction.total_latency_ms,
                "created_at": prediction.created_at.isoformat() if prediction.created_at else None,
                "predictions": [
                    {
                        "ad_id": ad.ad_id,
                        "title": ad.title,
                        "ctr": ad.ctr,
                        "category": ad.category,
                    }
                    for ad in prediction.predictions
                ]
            })

        return Response({
            "user_id": user_id,
            "total_requests": len(data),
            "prediction_history": data,
        })

    except Exception as e:
        return Response(
            {"error": f"Failed to fetch predictions: {str(e)}"},
            status=500
        )

    finally:
        session.close()

import logging

logger = logging.getLogger(__name__)

@api_view(["POST"])
def predict_ctr(request):
    serializer = CTRRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"error": "Invalid request", "details": serializer.errors}, status=400)

    try:
        data = serializer.validated_data
        user_id = data["user_id"]
        profile = data["profile"]
        context = data["context"]

        start = time.time()

        # Build feature vector from profile + context
        feature_vector = build_feature_vector(profile, context)

        # Get base CTR prediction from model
        base_score = ctr_model_service.predict(feature_vector)

        # Match ads from catalog based on user interests
        matched_ads = match_ads_to_interests(profile)

        if not matched_ads:
            return Response({
                "user_id": user_id,
                "chosen_ad": None,
                "predictions": [],
                "total_latency_ms": int((time.time() - start) * 1000),
                "message": "No matching ads found for user interests"
            })

        # Build recent_ads lookup for historical CTR data
        recent_ads_map = {
            ad["ad_id"]: ad for ad in profile.get("recent_ads", [])
        }

        predictions = []
        best_ad = None
        best_ctr = -1

        for ad in matched_ads:
            ad_start = time.time()

            # Use historical CTR if this ad appeared in recent_ads, otherwise use base score
            historical = recent_ads_map.get(ad["ad_id"])
            if historical:
                ad_ctr_rate = historical.get("ctr_rate", 0)
                is_relevant = historical.get("is_relevant", False)
                relevance_boost = 0.1 if is_relevant else -0.05
                ctr = round(
                    (base_score * 0.4) + (ad_ctr_rate * 0.4) + (ad["relevance_score"] * 0.05) + relevance_boost,
                    2
                )
            else:
                ctr = round(
                    (base_score * 0.5) + (ad["relevance_score"] * 0.1),
                    2
                )

            ctr = max(0.0, min(1.0, ctr))

            ad_latency_ms = int((time.time() - ad_start) * 1000)

            predictions.append({
                "ad_id": ad["ad_id"],
                "title": ad["title"],
                "ctr": ctr,
                "category": ad["category"],
            })

            # Log prediction (non-blocking — errors are caught inside)
            log_prediction(
                request_id=user_id,
                user_id=user_id,
                ad_id=ad["ad_id"],
                predicted_ctr=ctr,
                model_version="ctr_model_v3",
                latency_ms=ad_latency_ms,
            )

            if ctr > best_ctr:
                best_ctr = ctr
                best_ad = ad["ad_id"]

        # Sort predictions by CTR descending
        predictions.sort(key=lambda x: x["ctr"], reverse=True)

        total_latency_ms = int((time.time() - start) * 1000)

        # Save request data to user_context_data table (non-blocking)
        try:
            save_user_context(data, chosen_ad=best_ad, total_latency_ms=total_latency_ms)
        except Exception as e:
            logger.exception("Failed to save user context: %s", str(e))

        # Save predictions to user_ad_prediction + ad_prediction tables (non-blocking)
        try:
            save_ad_predictions(user_id, best_ad, predictions, total_latency_ms)
        except Exception as e:
            logger.exception("Failed to save ad predictions: %s", str(e))

        return Response({
            "user_id": user_id,
            "chosen_ad": best_ad,
            "predictions": predictions,
            "total_latency_ms": total_latency_ms,
        })

    except Exception as e:
        logger.exception("CTR prediction failed for request: %s", str(e))
        return Response(
            {"error": "Prediction failed", "detail": str(e)},
            status=500
        )
'''
What happens inside CTR service

Receive ad candidates
Build feature vector
Send features to ML model
Model predicts CTR
Rank ads
Return best ad
'''


'''
ad_start = time.time() → start timer for this specific ad

ad_latency_ms = int((time.time() - ad_start) * 1000) → compute milliseconds

log_prediction() now logs per-ad latency'''