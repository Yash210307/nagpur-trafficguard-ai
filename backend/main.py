
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from data_loader import load_locations
from risk_engine import calculate_risk
from deployment_engine import calculate_deployment


app = FastAPI(
    title="Nagpur TrafficGuard AI",
    description="AI-based traffic risk and police deployment prototype",
    version="1.0.0"
)


# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


locations = load_locations()

TOTAL_OFFICERS = 12


def process_location(location):
    risk = calculate_risk(location)

    deployment = calculate_deployment(
        location,
        risk["risk_score"]
    )

    result = {
        **location,
        **risk,
        **deployment
    }

    return result


@app.get("/")
def root():
    return {
        "message": "Nagpur TrafficGuard AI API is running"
    }


@app.get("/api/locations")
def get_locations():

    results = []

    for location in locations:
        results.append(
            process_location(location)
        )

    return {
        "total": len(results),
        "locations": results
    }


@app.get("/api/locations/{location_id}")
def get_location(location_id: int):

    for location in locations:

        if int(location["location_id"]) == location_id:
            return process_location(location)

    raise HTTPException(
        status_code=404,
        detail="Location not found"
    )


@app.get("/api/dashboard")
def dashboard():

    results = [
        process_location(location)
        for location in locations
    ]

    results.sort(
        key=lambda x: x["risk_score"],
        reverse=True
    )

    high = sum(
        1
        for x in results
        if x["risk_level"] == "HIGH"
    )

    medium = sum(
        1
        for x in results
        if x["risk_level"] == "MEDIUM"
    )

    low = sum(
        1
        for x in results
        if x["risk_level"] == "LOW"
    )

    unmanned = sum(
        1
        for x in results
        if x["current_police"] == 0
        and x["risk_score"] >= 70
    )

    return {
        "total_locations": len(results),
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "high_risk_unmanned": unmanned,
        "total_available_officers": TOTAL_OFFICERS,
        "top_priorities": results[:10]
    }