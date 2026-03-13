import hashlib


EXPERIMENTS = {
    "ctr_model_test": {
        "variants": {
            "A": {
                "traffic": 50,
                "model_version": "ctr_model_v1"
            },
            "B": {
                "traffic": 50,
                "model_version": "ctr_model_v2"
            }
        }
    }
}


def assign_variant(user_id, experiment_key):

    exp = EXPERIMENTS.get(experiment_key)

    if not exp:
        return None

    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 100

    cumulative = 0

    for variant, config in exp["variants"].items():

        cumulative += config["traffic"]

        if hash_value < cumulative:

            return {
                "variant": variant,
                "model_version": config["model_version"]
            }

    return None