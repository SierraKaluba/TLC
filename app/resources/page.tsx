import ReferenceDirectory from "@/components/reference-directory";

export const metadata = { title: "Nos travaux - TLC", description: "Projets, publications et ressources scientifiques de Tradition Learning Community." };

export default function Page() {
  return <ReferenceDirectory mode="publications" />;
}
