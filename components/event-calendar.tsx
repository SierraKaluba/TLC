"use client";

import { useState } from "react";

type EventRow = string[];
const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

export default function EventCalendar({ events, onRegister }: { events: EventRow[]; onRegister: (title: string) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = events.filter(event => event[7] && new Date(`${event[7]}T12:00:00`) >= today).sort((a, b) => a[7].localeCompare(b[7]));
  const nearest = upcoming[0];
  const nearestDate = nearest?.[7] || "";
  const displayDate = nearest ? new Date(`${nearest[7]}T12:00:00`) : new Date();
  const [selectedDate, setSelectedDate] = useState(nearest?.[7] || "");
  const activeDate = selectedDate || nearestDate;
  const month = displayDate.getMonth(); const year = displayDate.getFullYear();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const selected = upcoming.find(event => event[7] === activeDate) || nearest;
  return <div className="calendar"><article className="card event-calendar"><div className="card-meta"><h3>{displayDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h3><span>CALENDRIER TLC</span></div><div className="calendar-grid">{weekdays.map((day, i) => <span key={`${day}-${i}`}>{day}</span>)}{Array.from({ length: offset }, (_, i) => <span className="calendar-empty" key={`blank-${i}`} aria-hidden="true"/>)}{Array.from({ length: dayCount }, (_, i) => { const day = i + 1; const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; const event = upcoming.find(item => item[7] === iso); return <button type="button" key={iso} className={`${event ? "has-event" : ""}${activeDate === iso ? " selected" : ""}`} onClick={() => event && setSelectedDate(iso)} aria-label={event ? `${day} ${displayDate.toLocaleDateString("fr-FR", { month: "long" })} : ${event[3]}` : `${day}`}>{day}</button>; })}</div><p className="calendar-legend"><span/> Événement programmé</p></article>{selected ? <article className="card featured-event"><span className="eyebrow">PROCHAIN ÉVÉNEMENT</span><div className="featured-event-date"><strong>{selected[0]}</strong><span>{selected[1]}</span></div><span className="chip">{selected[2]}</span><h3>{selected[3]}</h3><p>{selected[4]}</p><p className="featured-event-meta">{selected[5]} · {selected[6]}</p><button className="button button-gold" onClick={() => onRegister(selected[3])}>S’inscrire à cet événement</button></article> : <article className="card featured-event"><span className="eyebrow">AGENDA TLC</span><h3>Aucun événement à venir</h3><p>Les prochains rendez-vous seront annoncés ici.</p></article>}</div>;
}
