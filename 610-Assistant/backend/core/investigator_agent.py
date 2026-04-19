import json
from datetime import datetime, timedelta
from pathlib import Path


ISO_Z_FORMAT = "%Y-%m-%dT%H:%M:%SZ"


def _parse_timestamp(value):
    return datetime.strptime(value, ISO_Z_FORMAT)


def _load_all_events():
    data_path = Path(__file__).resolve().parent.parent / "simulated_data.json"
    with data_path.open("r", encoding="utf-8") as data_file:
        return json.load(data_file)


def tool_get_events_by_location(location):
    """Tool: return events where location text contains the provided location."""
    events = _load_all_events()
    location_lower = location.lower()
    return [event for event in events if location_lower in event.get("location", "").lower()]


def tool_get_events_by_time_range(start, end):
    """
    Tool: return events in inclusive [start, end] range.
    start/end can be datetime objects or ISO strings (YYYY-MM-DDTHH:MM:SSZ).
    """
    events = _load_all_events()
    start_dt = _parse_timestamp(start) if isinstance(start, str) else start
    end_dt = _parse_timestamp(end) if isinstance(end, str) else end

    return [
        event
        for event in events
        if start_dt <= _parse_timestamp(event["timestamp"]) <= end_dt
    ]


def find_related_events(events):
    """
    Link events that happen within 10 minutes at the same location.
    Returns list of relation records.
    """
    sorted_events = sorted(events, key=lambda event: _parse_timestamp(event["timestamp"]))
    relations = []
    ten_minutes = timedelta(minutes=10)

    for index, first in enumerate(sorted_events):
        first_time = _parse_timestamp(first["timestamp"])
        first_location = first.get("location", "").strip().lower()

        for second in sorted_events[index + 1 :]:
            second_time = _parse_timestamp(second["timestamp"])
            if second_time - first_time > ten_minutes:
                break

            second_location = second.get("location", "").strip().lower()
            if first_location and first_location == second_location:
                relations.append(
                    {
                        "event_ids": [first["id"], second["id"]],
                        "location": first.get("location", ""),
                        "time_gap_minutes": int((second_time - first_time).total_seconds() // 60),
                    }
                )

    return relations


def run_investigation():
    """
    Run rule-based event triage and return structured JSON output.
    """
    agent_logs = []
    events = _load_all_events()
    agent_logs.append(f"Loaded {len(events)} events from simulated_data.json.")

    related_events = find_related_events(events)
    agent_logs.append(f"Identified {len(related_events)} linked event pairs within 10 minutes.")
    agent_logs.append("Tool used: get_events_by_location(Gate 3)")
    gate3_events = tool_get_events_by_location("Gate 3")
    agent_logs.append("Tool used: get_events_by_time_range(03:00–03:30)")
    time_window_events = tool_get_events_by_time_range(
        "2026-04-16T03:00:00Z", "2026-04-16T03:30:00Z"
    )

    suspicious = []
    harmless = []
    needs_followup = []
    event_reasons = {}

    for event in events:
        event_type = event.get("type", "")
        event_location = event.get("location", "").lower()

        if event_type == "noise":
            event_reasons[event["id"]] = "Noise pattern is likely environmental and non-threatening."
            harmless.append(event)
            agent_logs.append(
                f"Classified {event.get('id')} as harmless because type is noise."
            )
            continue

        if event_type == "vehicle_movement" and "storage" in event_location:
            event_reasons[event["id"]] = "Vehicle entered a restricted storage path and needs verification."
            needs_followup.append(event)
            agent_logs.append(
                f"Classified {event.get('id')} as needs_followup due to restricted-area vehicle movement."
            )
            continue

    # Detect badge_failure + fence_alert suspicious pattern at Gate 3.
    event_map = {event["id"]: event for event in events}
    suspicious_ids = set()
    correlated_pairs = []
    reasoning_notes = []
    drone_context_notes = []

    badge_events = [event for event in gate3_events if event.get("type") == "badge_failure"]
    fence_events = [event for event in gate3_events if event.get("type") == "fence_alert"]
    drone_events = [event for event in gate3_events if event.get("type") == "drone_patrol"]

    for badge_event in badge_events:
        badge_time = _parse_timestamp(badge_event["timestamp"])
        for fence_event in fence_events:
            fence_time = _parse_timestamp(fence_event["timestamp"])
            time_gap = fence_time - badge_time

            if timedelta(0) <= time_gap <= timedelta(minutes=10):
                if badge_event not in time_window_events or fence_event not in time_window_events:
                    continue
                agent_logs.append(
                    f"Found time correlation: {badge_event['id']} ({badge_event['timestamp']}) "
                    f"and {fence_event['id']} ({fence_event['timestamp']}) are {int(time_gap.total_seconds() // 60)} minutes apart."
                )
                agent_logs.append(
                    "Matched pattern: badge_failure followed by fence_alert at Gate 3."
                )
                suspicious_ids.add(badge_event["id"])
                suspicious_ids.add(fence_event["id"])
                correlated_pairs.append((badge_event["id"], fence_event["id"]))
                reasoning_notes.append(
                    "Multiple badge failures followed by fence disturbance suggests possible unauthorized access attempt."
                )
                reasoning_notes.append(
                    "Sequence detected: Badge failure -> Fence breach -> Drone verification"
                )
                event_reasons[badge_event["id"]] = (
                    "Multiple badge failures were followed by a nearby fence disturbance."
                )
                event_reasons[fence_event["id"]] = (
                    "Fence disturbance occurred shortly after repeated badge failures at the same gate."
                )
                agent_logs.append(
                    f"Added suspicion: {badge_event['id']} and {fence_event['id']} classified as suspicious."
                )

                for drone_event in drone_events:
                    drone_time = _parse_timestamp(drone_event["timestamp"])
                    drone_gap = drone_time - fence_time
                    if timedelta(0) <= drone_gap <= timedelta(minutes=20):
                        suspicious_ids.add(drone_event["id"])
                        context_note = "Drone patrol passed through the same area shortly after incident."
                        drone_context_notes.append(context_note)
                        event_reasons[drone_event["id"]] = (
                            "Drone verification occurred shortly after the suspicious access sequence."
                        )
                        agent_logs.append(
                            f"Added contextual support: {drone_event['id']} occurred {int(drone_gap.total_seconds() // 60)} minutes after suspicious event."
                        )

    for event in events:
        event_with_reason = {
            **event,
            "reason": event_reasons.get(event["id"], "No data available"),
        }
        if event["id"] in suspicious_ids:
            suspicious.append(event_with_reason)
        elif event in harmless:
            harmless[harmless.index(event)] = event_with_reason
        elif event in needs_followup:
            needs_followup[needs_followup.index(event)] = event_with_reason

    block_c_present = any("block c" in event.get("location", "").lower() for event in events)
    if block_c_present:
        reasoning_notes.append("Block C activity may require manual inspection")
        agent_logs.append("Added note: Block C activity may require manual inspection.")

    correlated_count = len(correlated_pairs)
    uncertainty_note = (
        "These signals are not fully confirmed as a single incident, but are likely related based on timing and location overlap."
        if correlated_count > 0
        else "No strong time-location correlation was found to confirm a linked incident."
    )

    summary_text = (
        f"Processed {len(events)} overnight events. Correlated {correlated_count} Gate 3 badge/fence sequence(s) "
        f"and flagged {len(suspicious)} suspicious event(s). {uncertainty_note} "
        f"Checked {len(time_window_events)} events in the 03:00-03:30 window."
    )

    summary_parts = [
        summary_text,
        f"Marked {len(needs_followup)} events for follow-up.",
        f"Classified {len(harmless)} events as harmless.",
    ]

    escalation_required = len(suspicious) > 0

    return {
        "summary": " ".join(summary_parts),
        "suspicious": suspicious,
        "harmless": harmless,
        "needs_followup": needs_followup,
        "agent_logs": agent_logs,
        "confidence": "medium",
        "escalation_required": escalation_required,
        "reasoning_notes": reasoning_notes,
        "drone_context": drone_context_notes,
    }
