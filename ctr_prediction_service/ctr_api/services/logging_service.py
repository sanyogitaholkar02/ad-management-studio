import logging

from ctr_api.model import PredictionLog

logger = logging.getLogger(__name__)


def log_prediction(request_id, user_id, ad_id, predicted_ctr, model_version, latency_ms):
    """
    Log a prediction to the PredictionLog table (Django ORM).
    Errors are caught and logged — they should not break the prediction API.
    """
    try:
        PredictionLog.objects.create(
            request_id=request_id,
            user_id=user_id,
            ad_id=ad_id,
            predicted_ctr=predicted_ctr,
            model_version=model_version,
            latency_ms=latency_ms
        )
    except Exception as e:
        logger.exception("Failed to log prediction for ad_id=%s: %s", ad_id, str(e))