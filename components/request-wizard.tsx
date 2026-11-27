"use client";

import { useState, type FormEvent } from "react";

type RequestKind = "join" | "event";
type FormState = { name: string; email: string; phone: string; profile: string; organization: string; message: string; attendance: string };

const communityEmail = "kalubasierra@gmail.com";
const communityWhatsApp = "243896675757";

export default function RequestWizard({ kind, title, details, onClose }: { kind: RequestKind; title: string; details?: string; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", profile: "", organization: "", message: "", attendance: "En ligne" });
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) { setStep((current) => current + 1); return; }
    const subject = kind === "event" ? `Inscription — ${title}` : "Candidature — communauté TLC";
    const message = [
      subject, `Nom : ${form.name}`, `E-mail : ${form.email}`, `Téléphone : ${form.phone}`,
      `Profil : ${form.profile}`, `Organisation : ${form.organization || "Non précisée"}`,
      ...(kind === "event" ? [`Événement : ${title}`, `Participation : ${form.attendance}`] : []),
      `Message : ${form.message || "Aucun message"}`,
    ].join("\n");
    const url = `https://wa.me/${communityWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  const label = kind === "event" ? "Inscription à l’événement" : "Candidature à la communauté";
  return <div className="request-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="request-dialog" role="dialog" aria-modal="true" aria-labelledby="request-title">
      <button className="request-close" type="button" onClick={onClose} aria-label="Fermer">×</button>
      {sent ? <div className="request-confirmation">
        <span className="request-confirmation-icon" aria-hidden="true">✓</span>
        <p className="eyebrow">DEMANDE PRÉPARÉE</p><h2 id="request-title">Merci, {form.name.split(" ")[0]}.</h2>
        <p>WhatsApp s’est ouvert avec les informations de ta demande. Il ne reste qu’à appuyer sur « Envoyer » dans WhatsApp.</p>
        <a href={`mailto:${communityEmail}?subject=${encodeURIComponent(kind === "event" ? `Inscription — ${title}` : "Candidature — communauté TLC")}&body=${encodeURIComponent(`Nom : ${form.name}\nE-mail : ${form.email}\nTéléphone : ${form.phone}\nProfil : ${form.profile}\nOrganisation : ${form.organization}\n${form.message}`)}`}>Utiliser l’e-mail à la place</a>
        {kind === "join" && <a href="https://tlc-ruby.vercel.app/join" target="_blank" rel="noreferrer">Ouvrir le formulaire complet d’adhésion</a>}
        <button className="button button-gold" type="button" onClick={onClose}>Terminer</button>
      </div> : <>
        <div className="request-heading"><span className="eyebrow">{label}</span><h2 id="request-title">{title}</h2>{details && <p>{details}</p>}{kind === "join" && <a className="request-official-link" href="https://tlc-ruby.vercel.app/join" target="_blank" rel="noreferrer">Ouvrir le formulaire officiel d’adhésion</a>}</div>
        <div className="request-progress" aria-label={`Étape ${step} sur 3`}>
          {["Coordonnées", "Profil", "Confirmation"].map((item, index) => <div className={step >= index + 1 ? "is-active" : ""} key={item}><span>{index + 1}</span>{item}</div>)}
        </div>
        <form className="request-form" onSubmit={submit}>
          {step === 1 && <div className="request-fields">
            <div className="field"><label htmlFor="request-name">Nom complet</label><input id="request-name" autoComplete="name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Votre nom"/></div>
            <div className="field"><label htmlFor="request-email">Adresse e-mail</label><input id="request-email" autoComplete="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@exemple.com"/></div>
            <div className="field"><label htmlFor="request-phone">Téléphone / WhatsApp</label><input id="request-phone" autoComplete="tel" type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+243 …"/></div>
          </div>}
          {step === 2 && <div className="request-fields">
            <div className="field"><label htmlFor="request-profile">Votre profil</label><select id="request-profile" required value={form.profile} onChange={(e) => update("profile", e.target.value)}><option value="" disabled>Choisir un profil</option><option>Chercheur / chercheuse</option><option>Développeur / développeuse</option><option>Étudiant / étudiante</option><option>Enseignant / enseignante</option><option>Autre</option></select></div>
            <div className="field"><label htmlFor="request-organization">Organisation (facultatif)</label><input id="request-organization" value={form.organization} onChange={(e) => update("organization", e.target.value)} placeholder="Université, entreprise…"/></div>
            {kind === "event" && <div className="field"><label htmlFor="request-attendance">Participation</label><select id="request-attendance" value={form.attendance} onChange={(e) => update("attendance", e.target.value)}><option>En ligne</option><option>En présentiel</option><option>À confirmer</option></select></div>}
            <div className="field"><label htmlFor="request-message">{kind === "event" ? "Question ou précision (facultatif)" : "Votre motivation"}</label><textarea id="request-message" required={kind === "join"} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder={kind === "event" ? "Ajouter une précision…" : "Comment souhaitez-vous contribuer ?"}/></div>
          </div>}
          {step === 3 && <div className="request-review"><p>Vérifie les informations avant d’envoyer ta demande à l’administration TLC sur WhatsApp.</p><dl><div><dt>Nom</dt><dd>{form.name}</dd></div><div><dt>E-mail</dt><dd>{form.email}</dd></div><div><dt>Téléphone</dt><dd>{form.phone}</dd></div><div><dt>Profil</dt><dd>{form.profile}</dd></div>{kind === "event" && <div><dt>Participation</dt><dd>{form.attendance}</dd></div>}<div><dt>Message</dt><dd>{form.message || "Aucun message"}</dd></div></dl></div>}
          <div className="request-actions">{step > 1 && <button className="button button-outline-dark" type="button" onClick={() => setStep((current) => current - 1)}>Retour</button>}<button className="button button-gold" type="submit">{step === 3 ? "Confirmer et envoyer" : "Continuer"}</button></div>
        </form>
      </>}
    </section>
  </div>;
}
