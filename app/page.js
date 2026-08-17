import Link from "next/link";
import Nav from "./components/Nav";

export default function Home() {
  return (
    <div className="shell">
      <Nav />
      <h1>Bun venit</h1>
      <p className="subtitle">Alege ce vrei să gestionezi.</p>

      <div className="grid-2">
        <Link href="/materiale" className="home-card">
          <div className="eyebrow">Stoc</div>
          <h2>Materiale pentru vopsire</h2>
          <p>Lista completă cu tot ce ai pe stoc: vopsele, diluanți, lac, consumabile — cantitate, cod/culoare, preț, furnizor.</p>
        </Link>
        <Link href="/masini" className="home-card">
          <div className="eyebrow">Lucrări</div>
          <h2>Mașini vopsite</h2>
          <p>Pe ce mașini ai lucrat, ce s-a făcut și ce materiale s-au consumat pentru fiecare lucrare.</p>
        </Link>
      </div>
    </div>
  );
}
