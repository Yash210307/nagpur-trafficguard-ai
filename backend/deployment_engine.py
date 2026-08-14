def calculate_deployment(location, risk_score):
    """
    Calculate recommended police deployment for one location.
    This is a prototype using simulated data.
    """

    current_police = int(location.get("current_police", 0))
    nearby_officers = int(
        location.get("available_nearby_officers", 0)
    )

    recommended = 0

    if risk_score >= 85:
        recommended = 2

    elif risk_score >= 70:
        recommended = 2

    elif risk_score >= 50:
        recommended = 1

    else:
        recommended = 0

    # Never recommend more officers than are nearby
    if nearby_officers > 0:
        recommended = min(recommended, nearby_officers)

    coverage_gap = max(recommended - current_police, 0)

    reasons = []

    if risk_score >= 70:
        reasons.append("High traffic risk")

    if location.get("accident_count", 0) >= 3:
        reasons.append("High accident history")

    if location.get("congestion_level", 0) >= 70:
        reasons.append("Severe congestion")

    if location.get("violation_count", 0) >= 18:
        reasons.append("High violation frequency")

    if current_police == 0 and risk_score >= 70:
        reasons.append("Currently unmanned")

    if location.get("road_obstruction", 0) >= 50:
        reasons.append("Road obstruction")

    if location.get("public_event", False):
        reasons.append("Public event")

    if location.get("roadwork", False):
        reasons.append("Roadwork")

    return {
        "current_police": current_police,
        "recommended_police": recommended,
        "coverage_gap": coverage_gap,
        "reasons": reasons
    }