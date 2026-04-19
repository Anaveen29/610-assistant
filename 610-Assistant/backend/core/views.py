import json
from pathlib import Path

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .investigator_agent import run_investigation


def load_simulated_events():
    data_path = Path(__file__).resolve().parent.parent / "simulated_data.json"
    with data_path.open("r", encoding="utf-8") as data_file:
        return json.load(data_file)


@api_view(["GET"])
def events_view(_request):
    return Response({"events": load_simulated_events()})


@api_view(["GET"])
def investigate_view(_request):
    investigation = run_investigation()
    return Response(investigation)
