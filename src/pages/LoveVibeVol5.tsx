import { useState, useEffect } from "react";

const tracks = [
  { num: "01", title: "已讀不回", sub: "", url: "https://soundcloud.com/coke-wang-703401983/cola-b-yi-du-bu-hui-1?secret_token=s-kHSruox3LPE" },
  { num: "02", title: "越來越冷淡", sub: "Shivering Version", url: "https://soundcloud.com/coke-wang-703401983/cola-b-yue-lai-yue-leng-dan-shivering-version-2?secret_token=s-GpZsebHg0IX" },
  { num: "03", title: "重重疊疊", sub: "", url: "https://soundcloud.com/coke-wang-703401983/colabzhong-zhong-die-die-3?secret_token=s-q2CVk9ozLSk" },
  { num: "04", title: "Slowburn", sub: "", url: "https://soundcloud.com/coke-wang-703401983/cola-b-slowburn-4?secret_token=s-YIaVQG2BNQL" },
  { num: "05", title: "Agony 愛過你", sub: "midnight", url: "https://soundcloud.com/coke-wang-703401983/cola-b-agony-ai-guo-ni-5?secret_token=s-qEcHlTGA9xT" },
  { num: "06", title: "Despair", sub: "3AM", url: "https://soundcloud.com/coke-wang-703401983/cola-b-despair-6?secret_token=s-WeErIu0n03x" },
  { num: "07", title: "Pain", sub: "4AM", url: "https://soundcloud.com/coke-wang-703401983/cola-b-pain-7?secret_token=s-lylwqaT5cJo" },
  { num: "08", title: "惡作劇", sub: "reflection after impact", url: "https://soundcloud.com/coke-wang-703401983/cola-b-e-zuo-ju-8?secret_token=s-0g07qnUDUtf" },
  { num: "09", title: "Decision", sub: "cinematic tension / internal weight", url: "https://soundcloud.com/coke-wang-703401983/cola-b-decision-9?secret_token=s-xWfbJ4MSoMh" },
  { num: "10", title: "Restraint", sub: "controlled closure", url: "https://soundcloud.com/coke-wang-703401983/cola-b-restraint-10?secret_token=s-FWhyjfKtmLF" },
];

const releasedAlbums = [
  { vol: "Vol. 1", title: "LOVEVIBE", spotifyId: "5P2B3GVhkJrfApyrmyPwvx" },
  { vol: "Vol. 2", title: "罣", spotifyId: "71nfEwVUkQ5ptIUQrRwULU" },
  { vol: "Vol. 3", title: "For U", spotifyId: "7tN7Oeewq3vKGxNOST7R3v" },
  { vol: "Vol. 4", title: "回", spotifyId: "19P4D7TAxBpW9xmN1OTBrr" },
];

const series = [
  {
    vol: "Vol. 1", title: "LOVEVIBE",
    zh: "愛開始出現，卻仲未有屬於自己嘅語言",
    story: "系列嘅第一章，以經典英文情歌 cover 為起點，建立出 LOVEVIBE 最初嘅情感世界。呢個選擇本身就有象徵意義：因為當愛情啱啱出現嘅時候，佢往往仲未有屬於自己嘅語言，亦未真正被寫成只屬於兩個人嘅故事。所以 Vol. 1 並唔係用原創作品去開始，而係借用一首首大家熟悉嘅情歌，去代表嗰種初次心動、理想化、帶住幻想同可能性嘅狀態。喺一段感情仲未成形之前，人好多時都會先透過別人寫過嘅歌，去理解自己當下嘅情緒。《LOVEVIBE》所呈現嘅，就係愛最初出現時嗰種未命名、未落實、卻已經開始佔據內心嘅感覺。"
  },
  {
    vol: "Vol. 2", title: "罣",
    zh: "思念變成彼此都明白嘅感情",
    story: "第二章以古字「罣」命名，代表一種掛念、一種放唔低、一種深深被對方牽動住嘅狀態。呢一章唔再只係單方面嘅喜歡，而係彼此都開始意識到，原來心入面已經有咗對方。由思念，到確認感情存在，《罣》係一個由曖昧走向情感認知嘅階段，亦係兩個人開始相信彼此對自己有特別意義嘅時刻。"
  },
  {
    vol: "Vol. 3", title: "For U",
    zh: "熱戀、投入、甜蜜與選擇",
    story: "第三章係整個 LOVEVIBE 系列最甜、最投入、亦最直接表達愛意嘅一章。所有歌名都以「U」結尾，令成張作品變成一種只屬於對方嘅情感投射——一首一首歌，好似都係為同一個人而寫。《For U》代表熱戀期最完整嘅樣子：甜蜜、靠近、溫柔、願意、選擇，亦係一段關係最明亮、最無保留嘅階段。"
  },
  {
    vol: "Vol. 4", title: "回",
    zh: "反思、拉扯、失焦與感情失衡",
    story: "如果話前面幾章都係一步一步走向愛情，咁《回》就係愛開始出現裂痕嘅地方。呢一章寫嘅唔係完全失去，而係感情仍然存在，卻開始慢慢失焦。溝通變弱，情緒開始卡住，說話講唔出口，誤會、重播、深夜已讀、欲言又止，全部都令一段關係逐步進入模糊地帶。由〈失焦 Out of Focus〉、〈Read at 2 a.m〉、〈Read Receipts Off〉到最後一首〈Sometimes Love Is Not Enough〉，《回》所呈現嘅，係一段關係由仍然相愛，到開始明白「愛未必足夠」之間嗰段最無聲、最現代、最令人反覆回味嘅過程。"
  },
  {
    vol: "Vol. 5", title: "離",
    zh: "分離、餘痛、看清與克制式收尾",
    story: "《離》係成個 LOVEVIBE 系列情感上最重、最痛、亦最完整嘅終章。如果前四章講嘅係愛點樣開始、點樣加深、點樣出現裂痕，咁《離》就係嗰段感情終於無法再維持之後，所剩低嘅一切。呢張作品唔只係 breakup album 咁簡單。佢寫嘅係距離感、失溫、回憶反覆堆疊、深夜絕望、情緒痛感、看清之後嘅荒謬感，最後再走到克制與收口。由〈已讀不回〉開始，到〈Agony 愛過你〉、〈Despair〉、〈Pain〉一路沉落去，再經過〈惡作劇〉嘅覺悟、〈Decision〉嘅重量，最後落喺〈Restraint〉呢種冷靜、節制、帶住痛但唔再回頭嘅結尾上，《離》唔止係一張失戀作品，而係一張關於點樣喺愛情消失之後，學識帶住傷口活落去嘅專輯。",
    active: true
  },
];

const PASSWORD = "chloethecat";

const css = `
  .lvv5-root * { box-sizing: border-box; }
  .gate { min-height: 100vh; background: #030810; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: Georgia, serif; padding: 2rem; }
  .gate-eyebrow { color: #6a5c40; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 1rem; font-family: sans-serif; }
  .gate-kanji { font-size: clamp(90px, 18vw, 150px); color: #e4d8c0; font-weight: 400; line-height: 1; margin-bottom: 0.25rem; }
  .gate-sub { color: #6a5c40; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 2.5rem; font-family: sans-serif; }
  .pw-input { background: transparent; border: 1px solid #2e2510; border-radius: 2px; padding: 13px 24px; color: #e4d8c0; font-size: 14px; width: 260px; text-align: center; letter-spacing: 3px; outline: none; margin-bottom: 8px; font-family: Georgia, serif; }
  .pw-input.err { border-color: #7a2e2e; }
  .pw-input:focus { border-color: #6a5c40; }
  .err-msg { color: #7a2e2e; font-size: 12px; margin-bottom: 8px; font-family: sans-serif; }
  .gate-btn { margin-top: 8px; background: transparent; border: 1px solid #6a5c40; color: #c8a070; padding: 11px 44px; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; cursor: pointer; border-radius: 2px; font-family: sans-serif; }
  .gate-btn:hover { background: #0d0d14; }
  .page { background: #030810; color: #e4d8c0; font-family: Georgia, serif; min-height: 100vh; max-width: 780px; margin: 0 auto; padding: 0 1.5rem 5rem; }
  .hdr { text-align: center; padding: 4rem 0 2rem; }
  .eyebrow { color: #6a5c40; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 1.25rem; font-family: sans-serif; font-weight: 400; }
  .kanji { font-size: clamp(72px, 14vw, 110px); color: #e4d8c0; font-weight: 400; line-height: 1; }
  .vol-label { color: #6a5c40; font-size: 11px; letter-spacing: 5px; text-transform: uppercase; margin: 0.75rem 0 0.5rem; font-family: sans-serif; font-weight: 400; }
  .credit { color: #3e3420; font-size: 11px; font-family: sans-serif; margin-top: 1rem; letter-spacing: 0.5px; }
  .cover { width: 100%; max-width: 460px; display: block; margin: 2.5rem auto; border-radius: 2px; }
  .section { margin-top: 3rem; border-top: 1px solid #13100a; padding-top: 2rem; }
  .sec-label { color: #6a5c40; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 1.5rem; font-family: sans-serif; font-weight: 400; }
  .player-wrap { border-radius: 2px; overflow: hidden; margin-bottom: 1.5rem; }
  .now-playing { font-size: 13px; color: #6a5c40; font-family: sans-serif; margin-bottom: 1rem; letter-spacing: 1px; }
  .now-playing span { color: #c8a070; }
  .track-row { display: flex; align-items: baseline; gap: 1.5rem; padding: 0.875rem 1rem; border-bottom: 1px solid #13100a; cursor: pointer; border-radius: 2px; transition: background 0.15s; }
  .track-row:hover { background: #080d18; }
  .track-row.active { background: #080d18; border-left: 2px solid #c8a070; padding-left: calc(1rem - 2px); }
  .track-num { color: #3e3420; font-size: 11px; font-family: sans-serif; letter-spacing: 1px; min-width: 22px; }
  .track-row.active .track-num { color: #c8a070; }
  .track-title { color: #e4d8c0; font-size: 16px; }
  .track-sub { color: #6a5c40; font-size: 13px; font-style: italic; }
  .play-hint { font-size: 11px; color: #3e3420; font-family: sans-serif; margin-top: 1rem; }
  .story-p { color: #a09070; font-size: 15px; line-height: 1.95; margin-bottom: 1rem; }
  .series-intro { color: #6a5c40; font-size: 14px; line-height: 1.85; margin-bottom: 2rem; font-style: italic; }
  .vol-block { margin-bottom: 2.5rem; padding-bottom: 2.5rem; border-bottom: 1px solid #13100a; }
  .vol-block:last-child { border-bottom: none; }
  .vol-header { display: flex; align-items: baseline; gap: 1.25rem; margin-bottom: 0.75rem; }
  .vol-tag { color: #3e3420; font-size: 10px; letter-spacing: 2px; font-family: sans-serif; text-transform: uppercase; }
  .vol-block.active .vol-tag { color: #c8a070; }
  .vol-title { font-size: 28px; color: #e4d8c0; font-weight: 400; }
  .vol-block.active .vol-title { color: #e4d8c0; }
  .vol-zh { color: #6a5c40; font-size: 12px; font-family: sans-serif; margin-bottom: 1rem; font-style: italic; }
  .vol-story { color: #a09070; font-size: 14px; line-height: 1.95; }
  .footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #13100a; text-align: center; color: #2a2010; font-size: 11px; font-family: sans-serif; letter-spacing: 0.5px; }
  .spotify-block { margin-bottom: 2rem; }
  .spotify-header { display: flex; align-items: baseline; gap: 1.25rem; margin-bottom: 0.75rem; }
  .spotify-tag { color: #3e3420; font-size: 10px; letter-spacing: 2px; font-family: sans-serif; text-transform: uppercase; }
  .spotify-title { font-size: 22px; color: #e4d8c0; font-weight: 400; }
  .spotify-iframe { border-radius: 2px; display: block; width: 100%; }
`;

export default function LoveVibeVol5() {
  const [pw, setPw] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);

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

  const embedUrl = (url: string) =>
    `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23c8a070&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;

  if (!open) return (
    <div className="lvv5-root">
      <style>{css}</style>
      <div className="gate">
        <p className="gate-eyebrow">Cola B — LoveVibe Vol. 5</p>
        <h1 className="gate-kanji">離</h1>
        <p className="gate-sub">Private A&amp;R Access</p>
        <input
          type="password"
          placeholder="Password"
          value={pw}
          className={`pw-input${err ? " err" : ""}`}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && tryUnlock()}
        />
        {err && <p className="err-msg">Incorrect password</p>}
        <button onClick={tryUnlock} className="gate-btn">Enter</button>
      </div>
    </div>
  );

  return (
    <div className="lvv5-root">
      <style>{css}</style>
      <div className="page">
        <header className="hdr">
          <p className="eyebrow">Cola B — Private A&amp;R Preview — Confidential</p>
          <h1 className="kanji">離</h1>
          <p className="vol-label">LoveVibe Vol. 5</p>
          <p className="credit">All lyrics, composition, arrangement &amp; production by Cola B</p>
        </header>

        <img src="/lovevibe-cover.jpg" alt="離 — LoveVibe Vol. 5" className="cover" />

        <section className="section">
          <p className="sec-label">Listen</p>
          <p className="now-playing">Now playing — <span>{tracks[activeTrack].title}</span></p>
          <div className="player-wrap">
            <iframe
              key={activeTrack}
              title={tracks[activeTrack].title}
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={embedUrl(tracks[activeTrack].url)}
            />
          </div>

          <p className="sec-label" style={{ marginTop: "1.5rem" }}>Tracklist</p>
          {tracks.map((t, i) => (
            <div
              key={t.num}
              className={`track-row${activeTrack === i ? " active" : ""}`}
              onClick={() => setActiveTrack(i)}
            >
              <span className="track-num">{t.num}</span>
              <div>
                <span className="track-title">{t.title}</span>
                {t.sub && <span className="track-sub"> — {t.sub}</span>}
              </div>
            </div>
          ))}
          <p className="play-hint">Click any track to play</p>
        </section>

        <section className="section">
          <p className="sec-label">About Vol. 5 — 離</p>
          <p className="story-p">《離》係成個 LOVEVIBE 系列情感上最重、最痛、亦最完整嘅終章。如果前四章講嘅係愛點樣開始、點樣加深、點樣出現裂痕，咁《離》就係嗰段感情終於無法再維持之後，所剩低嘅一切。</p>
          <p className="story-p">呢張作品唔只係 breakup album 咁簡單。佢寫嘅係距離感、失溫、回憶反覆堆疊、深夜絕望、情緒痛感、看清之後嘅荒謬感，最後再走到克制與收口。</p>
          <p className="story-p">由〈已讀不回〉開始，到〈Agony 愛過你〉、〈Despair〉、〈Pain〉一路沉落去，再經過〈惡作劇〉嘅覺悟、〈Decision〉嘅重量，最後落喺〈Restraint〉呢種冷靜、節制、帶住痛但唔再回頭嘅結尾上。如果話《回》已經講出「Sometimes Love Is Not Enough」，咁《離》就係嗰句說話最終被證明之後，真正發生嘅故事。</p>
        </section>

        <section className="section">
          <p className="sec-label">The LoveVibe Series — 完整五部曲</p>
          <p className="series-intro">LOVEVIBE 係 Cola B 一個橫跨五張作品嘅系列企劃，完整描寫一段感情由開始萌芽，到互相思念、投入、拉扯、崩解，最後走向分離嘅情緒軌跡。呢個系列唔只係幾張主題相關嘅專輯，而係一條有連續性、有情感推進、有明確章節感嘅長篇愛情故事。</p>
          {series.map(v => (
            <div key={v.vol} className={`vol-block${v.active ? " active" : ""}`}>
              <div className="vol-header">
                <span className="vol-tag">{v.vol}</span>
                <span className="vol-title">{v.title}</span>
              </div>
              <p className="vol-zh">{v.zh}</p>
              <p className="vol-story">{v.story}</p>
            </div>
          ))}
        </section>

        <footer className="footer">
          <p>© 2025 Cola B / Shiba Inu Records — Confidential. For A&amp;R review only. Do not distribute.</p>
        </footer>
      </div>
    </div>
  );
}
