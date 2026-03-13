import json
import logging

from ctr_api.db.database import get_db_session
from ctr_api.db.models import UserContextData, UserAdPrediction, AdPrediction

logger = logging.getLogger(__name__)


def save_user_context(data, chosen_ad=None, total_latency_ms=None):
    """
    Save the CTRRequestSerializer data to the user_context_data table.

    Args:
        data: validated_data from CTRRequestSerializer
        chosen_ad: the ad_id chosen by the prediction
        total_latency_ms: total prediction latency in ms
    """
    session = get_db_session()
    try:
        profile = data.get("profile", {})
        context = data.get("context", {})

        record = UserContextData(
            user_id=data["user_id"],

            # Profile fields — store lists as JSON strings
            age_group=profile.get("age_group"),
            interests=json.dumps(profile.get("interests", [])),
            search_history=json.dumps(profile.get("search_history", [])),
            preferred_topics=json.dumps(profile.get("preferred_topics", [])),
            background_info=json.dumps(profile.get("background_info", [])),
            price_preferences=json.dumps(profile.get("price_preferences", [])),
            influencers_followed=json.dumps(profile.get("influencers_followed", [])),
            current_interests=json.dumps(profile.get("current_interests", [])),
            recent_ads=json.dumps(profile.get("recent_ads", [])),

            # Context fields
            device_type=context.get("device_type"),
            country=context.get("country"),
            currency=context.get("currency"),
            time_of_day=context.get("time_of_day"),
            day_of_week=context.get("day_of_week"),

            # Prediction result
            chosen_ad=chosen_ad,
            total_latency_ms=total_latency_ms,
        )

        session.add(record)
        session.commit()
        logger.info("Saved user context data for user_id=%s", data["user_id"])

    except Exception as e:
        session.rollback()
        logger.exception("Failed to save user context data: %s", str(e))

    finally:
        session.close()


def save_ad_predictions(user_id, chosen_ad, predictions, total_latency_ms):
    """
    Save prediction results to user_ad_prediction and ad_prediction tables.

    Creates one UserAdPrediction row and multiple AdPrediction rows (one-to-many).

    Args:
        user_id: the user ID from the request
        chosen_ad: the ad_id with the highest CTR
        predictions: list of prediction dicts [{"ad_id", "title", "ctr", "category"}, ...]
        total_latency_ms: total prediction latency in ms
    """
    session = get_db_session()
    try:
        # Create the parent record
        user_prediction = UserAdPrediction(
            user_id=user_id,
            chosen_ad=chosen_ad,
            total_latency_ms=total_latency_ms,
        )

        # Create child records for each ad prediction
        for pred in predictions:
            ad_pred = AdPrediction(
                ad_id=pred["ad_id"],
                title=pred.get("title"),
                ctr=pred.get("ctr"),
                category=pred.get("category"),
            )
            user_prediction.predictions.append(ad_pred)

        session.add(user_prediction)
        session.commit()
        logger.info(
            "Saved %d ad predictions for user_id=%s (prediction_id=%s)",
            len(predictions), user_id, user_prediction.id
        )

    except Exception as e:
        session.rollback()
        logger.exception("Failed to save ad predictions: %s", str(e))

    finally:
        session.close()
