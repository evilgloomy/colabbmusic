import { useState, useEffect, CSSProperties } from "react";

const tracks = [
  { num: "01", title: "已讀不回", sub: "" },
  { num: "02", title: "越來越冷淡", sub: "" },
  { num: "03", title: "重重疊疊", sub: "" },
  { num: "04", title: "Slowburn", sub: "" },
  { num: "05", title: "愛過你 (Agony)", sub: "midnight" },
  { num: "06", title: "Despair", sub: "3AM" },
  { num: "07", title: "Pain", sub: "4AM" },
  { num: "08", title: "惡作劇", sub: "reflection after impact" },
  { num: "09", title: "Decision", sub: "cinematic tension / internal weight" },
  { num: "10", title: "Restraint", sub: "controlled closure" },
];

const series = [
  { vol: "Vol. 1", title: "LOVEVIBE", desc: "愛開始出現，卻仲未有屬於自己嘅語言" },
  { vol: "Vol. 2", title: "罣", desc: "思念變成彼此都明白嘅感情" },
  { vol: "Vol. 3", title: "For U", desc: "熱戀、投入、甜蜜與選擇" },
  { vol: "Vol. 4", title: "回", desc: "反思、拉扯、失焦與感情失衡" },
  { vol: "Vol. 5", title: "離", desc: "分離、餘痛、看清與克制式收尾", active: true },
];

const PASSWORD = "chloethecat";

const s: Record<string, CSSProperties> = {
  gate: { minHeight: "100vh", background: "#030810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", padding: "2rem" },
  gateEyebrow: { color: "#6a5c40", fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "1rem" },
  gateKanji: { fontSize: "clamp(90px,18vw,150px)", color: "#e4d8c0", margin: "0 0 0.25rem", fontWeight: 400, lineHeight: 1 },
  gateSub: { color: "#6a5c40", fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "2.5rem" },
  input: { background: "transparent", border: "1px solid #2e2510", borderRadius: "2px", padding: "13px 24px", color: "#e4d8c0", fontSize: "14px", width: "260px", textAlign: "center", letterSpacing: "3px", outline: "none", marginBottom: "8px" },
  inputErr: { borderColor: "#7a2e2e" },
  errMsg: { color: "#7a2e2e", fontSize: "12px", marginBottom: "8px", fontFamily: "sans-serif" },
  btn: { marginTop: "8px", background: "transparent", border: "1px solid #6a5c40", color: "#c8a070", padding: "11px 44px", fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" },
  page: { background: "#030810", color: "#e4d8c0", fontFamily: "Georgia,serif", minHeight: "100vh", maxWidth: "760px", margin: "0 auto", padding: "0 1.5rem 5rem" },
  hdr: { textAlign: "center", padding: "4rem 0 2rem" },
  eyebrow: { color: "#6a5c40", fontSize: "10px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "1.25rem", fontFamily: "sans-serif", fontWeight: 400 },
  kanji: { fontSize: "clamp(72px,14vw,110px)", color: "#e4d8c0", margin: 0, fontWeight: 400, lineHeight: 1 },
  volLabel: { color: "#6a5c40", fontSize: "11px", letterSpacing: "5px", textTransform: "uppercase", margin: "0.75rem 0 0.5rem", fontFamily: "sans-serif", fontWeight: 400 },
  credit: { color: "#3e3420", fontSize: "11px", fontFamily: "sans-serif", marginTop: "1rem", letterSpacing: "0.5px" },
  cover: { width: "100%", maxWidth: "460px", display: "block", margin: "2.5rem auto", borderRadius: "2px" },
  section: { marginTop: "3rem", borderTop: "1px solid #13100a", paddingTop: "2rem" },
  secLabel: { color: "#6a5c40", fontSize: "10px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "1.5rem", fontFamily: "sans-serif", fontWeight: 400 },
  playerWrap: { borderRadius: "2px", overflow: "hidden", background: "transparent" },
  trackRow: { display: "flex", alignItems: "baseline", gap: "1.5rem", padding: "0.875rem 0", borderBottom: "1px solid #13100a" },
  trackNum: { color: "#3e3420", fontSize: "11px", fontFamily: "sans-serif", letterSpacing: "1px", minWidth: "22px" },
  trackTitle: { color: "#e4d8c0", fontSize: "16px" },
  trackSub: { color: "#6a5c40", fontSize: "13px", fontStyle: "italic" },
  storyP: { color: "#a09070", fontSize: "15px", lineHeight: "1.95", marginBottom: "1rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.875rem" },
  card: { padding: "1.25rem 1rem", border: "1px solid #13100a", borderRadius: "2px" },
  cardActive: { border: "1px solid #2e2510", background: "#080d18" },
  cardVol: { color: "#3e3420", fontSize: "10px", letterSpacing: "2px", fontFamily: "sans-serif", marginBottom: "0.5rem", textTransform: "uppercase" },
  cardTitle: { color: "#e4d8c0", fontSize: "22px", marginBottom: "0.5rem", fontWeight: 400 },
  cardDesc: { color: "#6a5c40", fontSize: "12px", lineHeight: "1.65", fontFamily: "sans-serif" },
  footer: { marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #13100a", textAlign: "center", color: "#2a2010", fontSize: "11px", fontFamily: "sans-serif", letterSpacing: "0.5px" },
};

export default function LoveVibeVol5() {
  const [pw, setPw] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "離 — LoveVibe Vol. 5 (Private)";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      document.head.removeChild(meta);
    };
  }, []);

  const tryUnlock = () => {
    if (pw.trim().toLowerCase() === PASSWORD) { setOpen(true); setErr(false); }
    else setErr(true);
  };

  if (!open) return (
    <div style={s.gate}>
      <p style={s.gateEyebrow}>Cola B — LoveVibe Vol. 5</p>
      <h1 style={s.gateKanji}>離</h1>
      <p style={s.gateSub}>Private A&amp;R Access</p>
      <input
        type="password"
        placeholder="Password"
        value={pw}
        onChange={e => { setPw(e.target.value); setErr(false); }}
        onKeyDown={e => e.key === "Enter" && tryUnlock()}
        style={{ ...s.input, ...(err ? s.inputErr : {}) }}
      />
      {err && <p style={s.errMsg}>Incorrect password</p>}
      <button onClick={tryUnlock} style={s.btn}>Enter</button>
    </div>
  );

  return (
    <div style={s.page}>
      <header style={s.hdr}>
        <p style={s.eyebrow}>Cola B — Private A&amp;R Preview — Confidential</p>
        <h1 style={s.kanji}>離</h1>
        <p style={s.volLabel}>LoveVibe Vol. 5</p>
        <p style={s.credit}>All lyrics, composition, arrangement &amp; production by Cola B</p>
      </header>

      <img src="/lovevibe-cover.jpg" alt="離 — LoveVibe Vol. 5" style={s.cover} />

      <section style={s.section}>
        <p style={s.secLabel}>Listen</p>
        <div style={s.playerWrap}>
          <iframe
            title="LoveVibe Vol. 5"
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/coke-wang-703401983/sets/lmttotqjpijn&secret_token=s-mrr5qifjcC1&color=%23c8a070&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"
          />
        </div>
      </section>

      <section style={s.section}>
        <p style={s.secLabel}>Tracklist</p>
        {tracks.map(t => (
          <div key={t.num} style={s.trackRow}>
            <span style={s.trackNum}>{t.num}</span>
            <div>
              <span style={s.trackTitle}>{t.title}</span>
              {t.sub && <span style={s.trackSub}> — {t.sub}</span>}
            </div>
          </div>
        ))}
      </section>

      <section style={s.section}>
        <p style={s.secLabel}>About the album</p>
        <p style={s.storyP}>《離》係成個 LOVEVIBE 系列情感上最重、最痛、亦最完整嘅終章。如果前四章講嘅係愛點樣開始、點樣加深、點樣出現裂痕，咁《離》就係嗰段感情終於無法再維持之後，所剩低嘅一切。</p>
        <p style={s.storyP}>呢張作品唔只係 breakup album 咁簡單。佢寫嘅係距離感、失溫、回憶反覆堆疊、深夜絕望、情緒痛感、看清之後嘅荒謬感，最後再走到克制與收口。</p>
        <p style={s.storyP}>由〈已讀不回〉開始，到〈Agony 愛過你〉、〈Despair〉、〈Pain〉一路沉落去，再經過〈惡作劇〉嘅覺悟、〈Decision〉嘅重量，最後落喺〈Restraint〉呢種冷靜、節制、帶住痛但唔再回頭嘅結尾。</p>
      </section>

      <section style={s.section}>
        <p style={s.secLabel}>The LoveVibe Series</p>
        <div style={s.grid}>
          {series.map(v => (
            <div key={v.vol} style={{ ...s.card, ...(v.active ? s.cardActive : {}) }}>
              <p style={s.cardVol}>{v.vol}</p>
              <p style={s.cardTitle}>{v.title}</p>
              <p style={s.cardDesc}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={s.footer}>
        <p>© 2025 Cola B / Shiba Inu Records — Confidential. For A&amp;R review only. Do not distribute.</p>
      </footer>
    </div>
  );
}
