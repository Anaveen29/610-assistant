import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

function App() {
  const [events, setEvents] = useState([]);
  const [investigation, setInvestigation] = useState(null);
  const [approvedInsights, setApprovedInsights] = useState([]);
  const [challengedInsights, setChallengedInsights] = useState([]);
  const [droneStatus, setDroneStatus] = useState("Awaiting drone dispatch");
  const [droneLoading, setDroneLoading] = useState(false);
  const [briefingText, setBriefingText] = useState("");
  const [briefingTimestamp, setBriefingTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const markerRefs = useRef({});
  
  const [challengingEventId, setChallengingEventId] = useState(null);
  const [challengeReason, setChallengeReason] = useState("");

  const handleApprove = (event) => {
    setApprovedInsights((current) =>
      current.some((item) => item.id === event.id) ? current : [...current, event]
    );
    setChallengedInsights((current) => current.filter((item) => item.id !== event.id));
    if (event.lat && event.lng) {
      setSelectedLocation([event.lat, event.lng]);
    }
  };

  const submitChallenge = (event) => {
    const challengedEvent = { ...event, reason: challengeReason, isChallenged: true };
    setChallengedInsights((current) =>
      current.some((item) => item.id === event.id) ? current.map(item => item.id === event.id ? challengedEvent : item) : [...current, challengedEvent]
    );
    setApprovedInsights((current) => current.filter((item) => item.id !== event.id));
    setChallengingEventId(null);
    if (event.lat && event.lng) {
      setSelectedLocation([event.lat, event.lng]);
    }
  };

  const handleRunDroneCheck = () => {
    setDroneLoading(true);
    setDroneStatus("Drone en route to Gate 3...");
    setTimeout(() => {
      setDroneLoading(false);
      setDroneStatus("Drone confirms vehicle presence near Gate 3 perimeter");
    }, 4000);
  };

  const handleCardClick = (event) => {
    setSelectedEventId(event.id);
    if (event.lat && event.lng) {
      setSelectedLocation([event.lat, event.lng]);
    }
  };

  useEffect(() => {
    if (selectedEventId && markerRefs.current[selectedEventId]) {
      markerRefs.current[selectedEventId].openPopup();
    }
  }, [selectedEventId]);

  const buildBriefingText = () => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let text = `====================================================\n`;
    text += `MORNING BRIEFING REPORT\n`;
    text += `Generated at: ${timestamp} on ${date}\n`;
    text += `Prepared for: Site Head Review\n`;
    text += `====================================================\n\n`;

    text += `[FINAL DECISION]\n`;
    text += `→ Escalation Required: YES\n`;
    text += `→ Primary Area of Concern: Gate 3\n`;
    text += `→ Recommended Action: Immediate physical inspection and CCTV review\n\n`;

    text += `[EXECUTIVE SUMMARY]\n`;
    text += `At 03:10 AM, multiple badge failures occurred at Gate 3. Within 5 minutes, a fence disturbance was detected nearby. A drone later passed through the same area, confirming activity. This suggests a potential unauthorized entry attempt.\n\n`;

    text += `[APPROVED INSIGHTS & OVERRIDES]\n`;
    if (approvedInsights.length === 0 && challengedInsights.length === 0) {
      text += `- No insights were manually approved or overridden.\n`;
    } else {
      approvedInsights.forEach(event => {
        text += `- [APPROVED] ${event.title} at ${event.location}\n`;
      });
      challengedInsights.forEach(event => {
        text += `- [USER OVERRIDE] ${event.title} at ${event.location}\n`;
        text += `  Reasoning: "${event.reason}"\n`;
      });
    }

    text += `\n[DRONE DEPLOYMENT STATUS]\n`;
    text += `- ${droneStatus !== "Awaiting drone dispatch" ? droneStatus : "No drone actions dispatched."}\n`;

    return text;
  };

  const handleGenerateBriefing = () => {
    setBriefingText(buildBriefingText());
    setBriefingTimestamp(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
  };

  const suspiciousEvents = investigation?.suspicious || [];
  const harmlessEvents = investigation?.harmless || [];
  const followupEvents = investigation?.needs_followup || [];
  
  // Strong AI Agent Logs format
  const agentLogs = [
    "Loaded 6 events from simulated_data.json.",
    "No strong multi-event correlations found within a 10-minute window, suggesting events are not part of a tightly coordinated sequence.",
    "Retrieved events at Gate 3 using get_events_by_location.",
    "Analyzed activity between 03:00–03:30 using get_events_by_time_range.",
    "Classified EVT-101 as needs_followup due to restricted-area vehicle movement.",
    "Classified EVT-105 as harmless (noise pattern, no spatial or temporal correlation).",
    "Identified temporal proximity: EVT-102 and EVT-103 occurred within 5 minutes.",
    "Detected pattern: badge_failure followed by fence_alert at Gate 3.",
    "Classified EVT-102 and EVT-103 as suspicious due to timing and location overlap, but not confirmed due to lack of additional corroborating signals.",
    "Added contextual support: EVT-104 occurred 15 minutes later in the same area.",
    "Noted additional activity in Block C requiring manual inspection.",
    "Final assessment: Likely unauthorized access attempt at Gate 3 with moderate confidence. Manual inspection recommended."
  ];

  const reasoningNotes = investigation?.reasoning_notes || [];
  const droneContext = investigation?.drone_context || [];
  const hasBlockCActivity = events.some((event) =>
    event.location?.toLowerCase().includes("block c")
  );

  const suspiciousPositions = suspiciousEvents
    .filter(e => e.lat && e.lng)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map(e => [e.lat, e.lng]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const [eventsResponse, investigateResponse] = await Promise.all([
          axios.get(`${apiUrl}/api/events/`).catch(() => ({ data: { events: [] } })),
          axios.get(`${apiUrl}/api/investigate/`).catch(() => ({ data: null })),
        ]);
        setEvents(eventsResponse.data?.events ?? []);
        setInvestigation(investigateResponse.data ?? null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1120] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-300">6:10 Assistant</h1>
            <p className="text-slate-400 mt-1 font-medium">Overnight Intelligence & Review Platform</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              System Active
            </div>
            <span className="text-slate-600">|</span>
            <span>Shift: Overnight</span>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64 rounded-xl border border-slate-800 bg-slate-900/50 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
              <span className="text-slate-400 font-medium tracking-wide">Initializing workspace...</span>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            
            {/* LEFT COLUMN - VISUALIZATION & REPORTS */}
            <div className="space-y-8 lg:col-span-8">
              
              {/* Map Section */}
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 shadow-2xl overflow-hidden flex flex-col">
                <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 tracking-wide">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                    Site Event Map
                  </h2>
                  <div className="flex gap-4 text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></div> Suspicious</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]"></div> Follow-up</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"></div> Harmless</span>
                  </div>
                </div>
                <div className="h-[450px] w-full z-0 relative">
                  <MapContainer center={[12.9768, 77.6008]} zoom={15} className="h-full w-full z-0">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={selectedLocation} zoom={16} />
                    
                    {suspiciousPositions.length > 1 && (
                      <Polyline positions={suspiciousPositions} pathOptions={{ color: '#ef4444', weight: 3, dashArray: '5, 10' }} />
                    )}

                    {events.map((event) => {
                      let color = "#3b82f6"; // blue
                      if (suspiciousEvents.some(e => e.id === event.id)) color = "#ef4444"; // red
                      else if (followupEvents.some(e => e.id === event.id)) color = "#eab308"; // yellow
                      else if (harmlessEvents.some(e => e.id === event.id)) color = "#22c55e"; // green
                      
                      const isSelected = selectedEventId === event.id;
                      const iconHtml = `<div style="background-color: ${color}; width: ${isSelected ? 18 : 12}px; height: ${isSelected ? 18 : 12}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}; transition: all 0.2s;"></div>`;
                      
                      const customIcon = new L.DivIcon({
                        className: 'custom-div-icon',
                        html: iconHtml,
                        iconSize: [isSelected ? 18 : 12, isSelected ? 18 : 12],
                        iconAnchor: [isSelected ? 9 : 6, isSelected ? 9 : 6]
                      });

                      return (
                        <Marker 
                          key={event.id} 
                          position={[event.lat, event.lng]}
                          icon={customIcon}
                          ref={(ref) => {
                            if (ref) markerRefs.current[event.id] = ref;
                          }}
                          eventHandlers={{
                            click: () => handleCardClick(event)
                          }}
                        >
                          <Popup>
                            <div className="text-slate-900 min-w-[200px]">
                              <p className="font-bold text-sm text-slate-800">{event.title}</p>
                              <p className="text-[11px] font-medium text-slate-500 mt-1">{event.timestamp}</p>
                              <p className="text-[11px] font-medium text-indigo-600 mt-1">{event.location}</p>
                              <p className="text-[11px] mt-1"><span className="font-semibold">Severity:</span> {event.severity}</p>
                              <p className="text-[12px] mt-2 border-t border-slate-200 pt-2 leading-relaxed">{event.details}</p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </div>

              {/* Morning Briefing Output */}
              <div className="rounded-xl border border-sky-900/50 bg-slate-800/80 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-indigo-500/5 pointer-events-none"></div>
                <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800 flex items-center justify-between relative z-10">
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                      <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Morning Briefing Export
                    </h3>
                    {briefingTimestamp && (
                      <span className="text-[11px] text-slate-400 mt-1 animate-fade-in transition-all duration-300">Last updated at {briefingTimestamp}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBriefing}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-500 hover:-translate-y-0.5 shadow-lg shadow-sky-900/40"
                  >
                    Generate Briefing
                  </button>
                </div>
                <div className="p-5 bg-[#0d1326] min-h-[140px] relative z-10">
                  {briefingText ? (
                    <pre className="whitespace-pre-wrap font-mono text-[13px] leading-loose text-slate-300 bg-slate-900/80 p-5 rounded-lg border border-slate-700/50 shadow-inner animate-fade-in transition-all duration-500">
                      {briefingText}
                    </pre>
                  ) : (
                    <div className="flex h-full items-center justify-center text-[13px] text-slate-500 italic py-6">
                      Click "Generate Briefing" to freeze the report, add timestamps, and format the handoff.
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Timeline & Secondary Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Agent Timeline */}
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 shadow-2xl overflow-hidden md:col-span-2">
                  <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800">
                    <h3 className="text-sm font-semibold text-sky-300 flex items-center gap-2 tracking-wide">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      AI Agent Investigation Timeline (Reasoning)
                    </h3>
                  </div>
                  <div className="p-5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <ul className="space-y-4">
                      {agentLogs.map((log, index) => (
                        <li
                          key={`agent-${index}`}
                          className="flex items-start gap-4"
                        >
                          <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/30 text-[11px] font-bold text-sky-400">
                            {index + 1}
                          </span>
                          <span className="text-[13px] leading-relaxed text-slate-300 pt-0.5">
                            {log}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Harmless Events */}
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 shadow-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800">
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 tracking-wide">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Classified Harmless
                    </h3>
                  </div>
                  <div className="p-4 bg-[#0d1326]/50 h-full">
                    <ul className="space-y-3">
                      {harmlessEvents.map((event) => (
                        <li
                          key={event.id}
                          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-sm transition-all hover:bg-emerald-500/10 hover:-translate-y-0.5"
                        >
                          <p className="font-semibold text-slate-200">{event.title}</p>
                          <p className="text-xs font-medium text-emerald-400/80 mt-1.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            {event.location}
                          </p>
                        </li>
                      ))}
                      {harmlessEvents.length === 0 && (
                        <li className="text-[13px] text-slate-500 italic text-center py-4">No harmless events detected.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Needs Follow-up */}
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 shadow-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800">
                    <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2 tracking-wide">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Needs Follow-up
                    </h3>
                  </div>
                  <div className="p-4 bg-[#0d1326]/50 h-full">
                    <ul className="space-y-3">
                      {followupEvents.map((event) => (
                        <li
                          key={event.id}
                          className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3.5 text-sm transition-all hover:bg-yellow-500/10 hover:-translate-y-0.5"
                        >
                          <p className="font-semibold text-slate-200">{event.title}</p>
                          <p className="text-xs font-medium text-yellow-400/80 mt-1.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            {event.location}
                          </p>
                        </li>
                      ))}
                      {followupEvents.length === 0 && (
                        <li className="text-[13px] text-slate-500 italic text-center py-4">No events need follow-up.</li>
                      )}
                    </ul>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN - REVIEW & ACTIONS */}
            <aside className="space-y-8 lg:col-span-4 sticky top-6">
              
              {/* Action Priority Panel (Replaces old simple Escalation) */}
              <div className="rounded-xl border border-red-500/40 bg-red-500/5 shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-red-500/20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-red-400">
                      <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      Urgent Action Required
                    </h3>
                    <span className="px-3 py-1 rounded-md text-[11px] font-extrabold tracking-widest bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                      PRIORITY: HIGH
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Required By</p>
                      <p className="text-xs font-semibold text-slate-200 mt-1">15 Minutes (08:00 AM)</p>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended Action</p>
                      <p className="text-xs font-semibold text-slate-200 mt-1">Dispatch security to Gate 3</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overnight Summary Card */}
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 shadow-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800">
                  <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 tracking-wide">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Overnight Summary
                  </h2>
                </div>
                <div className="p-5 space-y-5 bg-[#0d1326]/50">
                  
                  {/* Story Reconstruction (AI Narrative) */}
                  <div className="rounded-lg bg-slate-900/60 p-4 border border-slate-700/50 shadow-inner space-y-2">
                    <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                      AI Narrative Reconstruction
                    </p>
                    <p className="text-[13px] text-slate-300 leading-relaxed">
                      At 03:10 AM, multiple badge failures occurred at Gate 3. Within 5 minutes, a fence disturbance was detected nearby. A drone later passed through the same area, confirming activity. This sequence suggests a potential unauthorized entry attempt.
                    </p>
                  </div>
                  
                  {/* Uncertainty Handling */}
                  <div className="flex flex-col gap-2 bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full transition-all duration-500 bg-yellow-500 w-[65%] shadow-[0_0_8px_rgba(234,179,8,0.8)]`}></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Medium (65%)</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-400">Why not higher?</span>
                        <p className="text-slate-300 mt-0.5">No visual confirmation of individuals; lack of repeated pattern across zones.</p>
                      </div>
                      <div className="border-t border-slate-700/50 pt-2 mt-1">
                        <span className="font-bold text-slate-400">What could change confidence?</span>
                        <p className="text-slate-300 mt-0.5">Drone visual confirmation or additional badge failures in adjacent blocks.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-700/50">
                    <button
                      type="button"
                      onClick={handleRunDroneCheck}
                      disabled={droneLoading}
                      className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-[13px] font-bold text-white transition-all hover:bg-indigo-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg shadow-indigo-900/30"
                    >
                      {droneLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                          Dispatching Drone...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                          Run Drone Patrol Simulation
                        </>
                      )}
                    </button>
                    {droneStatus !== "Awaiting drone dispatch" && (
                      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3.5 text-[13px] text-indigo-200 animate-fade-in flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="font-medium leading-relaxed">{droneStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Investigation Review (The Core Action Area) */}
              <div className="rounded-xl border border-red-900/40 bg-slate-800 shadow-2xl overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-red-900/40 bg-red-950/30">
                  <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    AI Investigation Review
                  </h3>
                  <p className="text-[12px] text-red-300/70 mt-1.5 font-medium">Review flagged suspicious activities</p>
                </div>
                <div className="p-5 bg-[#0d1326]/80 space-y-5">
                  
                  {/* AI Recommendation Block */}
                  {suspiciousEvents.length > 0 && (
                    <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/50 p-4 shadow-inner mb-2">
                      <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        AI Recommendation
                      </p>
                      <div className="grid grid-cols-1 gap-3 text-[12px]">
                        <div className="flex justify-between items-center border-b border-indigo-900/30 pb-2">
                          <span className="font-semibold text-slate-400">Likely Scenario</span>
                          <span className="font-bold text-slate-200">Unauthorized access attempt</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-indigo-900/30 pb-2">
                          <span className="font-semibold text-slate-400">Risk Level</span>
                          <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">Medium-High</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-400">Suggested Action</span>
                          <span className="font-bold text-indigo-300">Physical inspection + CCTV review</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <ul className="space-y-4">
                    {suspiciousEvents.map((event) => {
                      const isApproved = approvedInsights.some((item) => item.id === event.id);
                      const isChallenged = challengedInsights.some((item) => item.id === event.id);
                      const isChallengingThis = challengingEventId === event.id;

                      return (
                        <li
                          key={event.id}
                          onClick={() => handleCardClick(event)}
                          className={`cursor-pointer rounded-xl border p-4.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isApproved ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : isChallenged ? 'border-amber-500/60 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-red-500/40 bg-red-500/10 shadow-red-900/10'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-100 text-[14px]">{event.title}</p>
                              <p className="text-[11px] font-medium text-slate-400 mt-1.5 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                {event.location}
                              </p>
                            </div>
                            {isApproved && (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shadow-sm">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Approved
                              </span>
                            )}
                            {isChallenged && (
                              <span className="shrink-0 inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-sm">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Overridden
                              </span>
                            )}
                          </div>
                          
                          {isChallenged ? (
                            <div className="mt-4 flex flex-col gap-2 transition-all duration-300">
                              <div className="text-[12px] bg-slate-900/40 p-3 rounded-lg border border-slate-700/30 opacity-60">
                                <span className="font-bold text-slate-500 line-through">AI Reason (Overridden): </span>
                                <span className="text-slate-400 font-medium leading-relaxed line-through">
                                  {event.reason || "Unknown"}
                                </span>
                              </div>
                              <div className="text-[12px] bg-amber-500/10 p-3 rounded-lg border border-amber-500/30 shadow-inner">
                                <span className="font-bold text-amber-400">User Override: </span>
                                <span className="text-amber-200/90 font-medium leading-relaxed">
                                  {challengedInsights.find(i => i.id === event.id)?.reason}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 text-[12px] bg-slate-900/40 p-3 rounded-lg border border-slate-700/30 transition-all duration-300">
                              <span className="font-bold text-slate-400">AI Reason: </span>
                              <span className="text-slate-300 font-medium leading-relaxed">
                                {event.reason || "Unknown"}
                              </span>
                            </div>
                          )}
                          
                          {!isApproved && !isChallenged && !isChallengingThis && (
                            <div className="mt-4 flex gap-3 pt-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleApprove(event); }}
                                className="flex-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-emerald-900/20"
                              >
                                Approve Context
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setChallengingEventId(event.id); setChallengeReason(""); }}
                                className="flex-1 rounded-lg bg-amber-600/90 hover:bg-amber-500 px-3 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-amber-900/20"
                              >
                                Challenge AI
                              </button>
                            </div>
                          )}

                          {isChallengingThis && (
                            <div className="mt-4 border-t border-slate-700/50 pt-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                              <label className="block text-[11px] font-bold text-amber-400/80 uppercase tracking-widest mb-2">Your Override Reasoning</label>
                              <textarea
                                className="w-full rounded-lg border border-amber-500/50 bg-slate-900 p-3 text-[13px] text-slate-200 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-slate-600 shadow-inner"
                                rows="3"
                                placeholder="e.g. Authorized contractor working late..."
                                value={challengeReason}
                                onChange={(e) => setChallengeReason(e.target.value)}
                                autoFocus
                              ></textarea>
                              <div className="mt-3 flex gap-3 justify-end items-center">
                                <button
                                  type="button"
                                  onClick={() => setChallengingEventId(null)}
                                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => submitChallenge(event)}
                                  className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-amber-900/20"
                                >
                                  Save Override
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {suspiciousEvents.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-sm italic">
                        No high-confidence threats detected.
                      </div>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Processed Insights Summary (Approved / Challenged) */}
              {(approvedInsights.length > 0 || challengedInsights.length > 0) && (
                <div className="rounded-xl border border-slate-700/60 bg-slate-800/80 shadow-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 tracking-wide">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                      Processed Insights Summary
                    </h3>
                  </div>
                  <div className="p-5 space-y-5 bg-[#0d1326]/50">
                    {approvedInsights.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Approved</h4>
                        <ul className="space-y-2.5">
                          {approvedInsights.map((event) => (
                            <li key={event.id} className="text-[13px] text-slate-300 flex items-start gap-2.5">
                              <span className="text-emerald-500 mt-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>
                              <span><span className="font-semibold text-slate-200">{event.title}</span> - <span className="text-slate-400 text-[12px]">{event.location}</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {challengedInsights.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-3">User Overrides</h4>
                        <ul className="space-y-3">
                          {challengedInsights.map((event) => (
                            <li key={event.id} className="text-[13px] text-slate-300 flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-lg border border-slate-700/30">
                              <span className="text-amber-500 mt-0.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></span>
                              <div>
                                <span className="font-semibold text-slate-200">{event.title}</span>
                                <p className="text-slate-400 mt-1 italic leading-relaxed text-[12px]">"{event.reason}"</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </aside>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
