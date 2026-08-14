import pandas as pd
from pathlib import Path


DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "nagpur_traffic_data.csv"
)


def load_locations():
    df = pd.read_csv(DATA_FILE)

    # Convert CSV boolean values
    df["roadwork"] = df["roadwork"].astype(bool)
    df["public_event"] = df["public_event"].astype(bool)

    return df.to_dict(orient="records")