from django.db import models
import numpy as np
import joblib
import os
import logging

logger = logging.getLogger(__name__)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "ctr_model.pkl")
MODEL_VERSION = "ctr_model_v1"


class CTRModel:

    def __init__(self):
        self.model = None
        try:
            if not os.path.exists(MODEL_PATH):
                logger.warning(
                    "CTR model file not found at %s. "
                    "Predictions will return a fallback score.", MODEL_PATH
                )
                return

            self.model = joblib.load(MODEL_PATH)
            logger.info("CTR model loaded successfully")

        except Exception as e:
            logger.exception("Failed to load CTR model")

    def predict(self, features):
        if self.model is None:
            logger.warning("No CTR model loaded — returning fallback score 0.0")
            return 0.0
        try:
            features = np.array(features).reshape(1, -1)
            prob = self.model.predict_proba(features)[0][1]
            return float(prob)
        except Exception as e:
            logger.exception("CTR prediction failed")
            raise e


ctr_model_service = CTRModel()