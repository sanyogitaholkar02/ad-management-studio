import hashlib
from ab_testing_api.models import ExperimentLog

# Example experiments configuration
EXPERIMENTS = {
    "ctr_model_test": {
        "variants": {
            "A": {"traffic": 50, "model_version": "ctr_model_v1"},
            "B": {"traffic": 50, "model_version": "ctr_model_v2"}
        }
    }
}


def assign_variant(user_id: str, experiment_key: str):
    """
    Deterministically assign a user to a variant using hashing
    """
    exp = EXPERIMENTS.get(experiment_key)
    if not exp:
        return None

    # Hash user_id → 0–99
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 100

    cumulative = 0
    for variant, config in exp["variants"].items():
        cumulative += config["traffic"]
        if hash_value < cumulative:
            return {
                "variant": variant,
                "model_version": config["model_version"]
            }

    # fallback (should not happen)
    return None


def log_experiment_assignment(user_id, experiment_key, variant, model_version):
    """
    Log the assignment to the database
    """
    ExperimentLog.objects.create(
        user_id=user_id,
        experiment_key=experiment_key,
        variant=variant,
        model_version=model_version
    )