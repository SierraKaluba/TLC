import { Quote } from "lucide-react";
import "./official-work.css";

const pythonText = "J\u2019aimerais contribuer \u00e0 tllib c\u00f4t\u00e9 Python. Participer aux tests ou \u00e0 la documentation serait d\u00e9j\u00e0 une mani\u00e8re d\u2019apprendre tout en faisant avancer le projet.";
const studentText = "\u00c0 l\u2019universit\u00e9, j\u2019ai surtout appris \u00e0 utiliser des mod\u00e8les existants. Tradition Learning m\u2019int\u00e9resse parce qu\u2019on peut aussi r\u00e9fl\u00e9chir \u00e0 la fa\u00e7on dont une IA apprend et transmet ses acquis.";
const researchText = "Je voudrais travailler sur la partie scientifique : comprendre les relations entre les participants, les formaliser et pr\u00e9parer des exp\u00e9riences qui permettent de les \u00e9tudier.";

const voices = [
  { text: pythonText, name: "Kaluba", profile: "D\u00e9veloppeuse Python", initials: "K" },
  { text: studentText, name: "Benwiz", profile: "Chercheur en informatique", initials: "B" },
  { text: researchText, name: "Kasanga", profile: "Chercheur en IA", initials: "K" },
  { text: pythonText, name: "Kasamba", profile: "D\u00e9veloppeuse Python", initials: "K" },
  { text: studentText, name: "Ngala-Mulume", profile: "Chercheur en informatique", initials: "N" },
  { text: researchText, name: "Mutombo", profile: "Chercheuse en IA", initials: "M" },
  { text: pythonText, name: "Musobokwela", profile: "D\u00e9veloppeuse Python", initials: "M" },
  { text: studentText, name: "Katombe", profile: "Chercheur en informatique", initials: "K" },
] as const;

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
          {[...voices, ...voices].map((voice, index) => (
            <article className="tlc-voice-card" key={`${voice.name}-${index}`} aria-hidden={index >= voices.length}>
              <Quote size={25} aria-hidden="true" className="tlc-voice-quote-icon" />
              <blockquote>{"\u00ab "}{voice.text}{" \u00bb"}</blockquote>
              <div className="tlc-voice-person">
                <span className="tlc-voice-initial" aria-hidden="true">{voice.initials}</span>
                <div><strong>{voice.name}</strong><span>{voice.profile}</span></div>
              </div>
            </article>
          ))}
        </div></div>
        <p className="tlc-voices-note">{"T\u00e9moignages fictifs illustrant diff\u00e9rents profils de participation."}</p>
      </div>
    </section>
  );
}

