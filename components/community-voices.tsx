import { Quote } from "lucide-react";
import "./official-work.css";

const pythonText = "J\u2019aimerais contribuer \u00e0 tllib c\u00f4t\u00e9 Python. Participer aux tests ou \u00e0 la documentation serait d\u00e9j\u00e0 une mani\u00e8re d\u2019apprendre tout en faisant avancer le projet.";
const studentText = "\u00c0 l\u2019universit\u00e9, j\u2019ai surtout appris \u00e0 utiliser des mod\u00e8les existants. Tradition Learning m\u2019int\u00e9resse parce qu\u2019on peut aussi r\u00e9fl\u00e9chir \u00e0 la fa\u00e7on dont une IA apprend et transmet ses acquis.";
const researchText = "Je voudrais travailler sur la partie scientifique : comprendre les relations entre les participants, les formaliser et pr\u00e9parer des exp\u00e9riences qui permettent de les \u00e9tudier.";

const voices = [
  { text: pythonText, profile: "D\u00e9veloppeuse Python", initials: "K" },
  { text: studentText, profile: "Chercheur en informatique", initials: "B" },
  { text: researchText, profile: "Chercheur en IA", initials: "K" },
] as const;

const people = ["Kaluba", "Benwiz", "Kasanga", "Kasamba", "Ngala-Mulume", "Mutombo", "Musobokwela", "Katombe"] as const;

export default function CommunityVoices() {
  return (
    <section className="section tlc-voices" aria-labelledby="tlc-voices-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">PARCOURS ILLUSTRATIFS</span>
          <h2 className="section-title" id="tlc-voices-title">{"Des raisons diff\u00e9rentes de rejoindre TLC."}</h2>
          <p className="section-copy">{"Recherche, programmation,\u00a0\u00e9tudes : chacun peut trouver une fa\u00e7on de participer aux travaux de la communaut\u00e9."}</p>
        </div>
        <div className="tlc-voices-window"><div className="tlc-voices-track">
          {[...people, ...people].map((name, index) => {
            const voice = voices[index % voices.length];
            return (
              <article className="tlc-voice-card" key={`${name}-${index}`} aria-hidden={index >= people.length}>
                <Quote size={25} aria-hidden="true" className="tlc-voice-quote-icon" />
                <blockquote>{"\u00ab "}{voice.text}{" \u00bb"}</blockquote>
                <div className="tlc-voice-person">
                  <span className="tlc-voice-initial" aria-hidden="true">{name.slice(0, 1)}</span>
                  <div><strong>{name}</strong><span>{voice.profile}</span></div>
                </div>
              </article>
            );
          })}
        </div></div>
        <p className="tlc-voices-note">Témoignages fictifs illustrant différents profils de participation.</p>
      </div>
    </section>
  );
}
