def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(value, maximum))


def calculate_risk(location):
    factors = {}

    congestion = float(location.get("congestion_level", 0))
    factors["Congestion"] = min(congestion * 0.18, 18)

    accidents = float(location.get("accident_count", 0))
    factors["Accidents"] = min(accidents * 4, 16)

    violations = float(location.get("violation_count", 0))
    factors["Violations"] = min(violations * 0.7, 14)

    illegal_parking = float(
        location.get("illegal_parking_level", 0)
    )
    factors["Illegal Parking"] = illegal_parking * 0.08

    obstruction = float(
        location.get("road_obstruction", 0)
    )
    factors["Road Obstruction"] = obstruction * 0.07

    weather = location.get(
        "weather_condition",
        "Clear"
    )

    weather_scores = {
        "Clear": 0,
        "Cloudy": 1,
        "Rain": 5,
        "Heavy Rain": 8,
        "Fog": 7
    }

    factors["Weather"] = weather_scores.get(
        weather,
        0
    )

    if location.get("roadwork", False):
        factors["Roadwork"] = 5

    if location.get("public_event", False):
        factors["Public Event"] = 5

    historical_risk = float(
        location.get("historical_risk", 0)
    )

    factors["Historical Risk"] = (
        historical_risk * 0.10
    )

    current_police = int(
        location.get("current_police", 0)
    )

    if current_police == 0:
        factors["Police Coverage Gap"] = 8
    else:
        factors["Police Coverage Gap"] = 0

    score = sum(factors.values())

    risk_score = round(
        clamp(score),
        2
    )

    if risk_score >= 70:
        risk_level = "HIGH"
    elif risk_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    factors = {
        key: round(value, 2)
        for key, value in factors.items()
        if value > 0
    }

    factors = dict(
        sorted(
            factors.items(),
            key=lambda item: item[1],
            reverse=True
        )
    )

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factors": factors
    }