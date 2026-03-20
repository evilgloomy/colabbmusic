import { useTranslation } from "react-i18next";

const brandContent = {
  en: {
    name: "Cola B",
    tagline: "Queen of Emo Pop",
    heroBody:
      "Cola B is a Mandarin pop singer-songwriter redefining emotional storytelling through a blend of Mandopop, Emo Pop, and modern digital artistry.",
    shortBio:
      "Cola B is a Mandarin pop singer-songwriter known for emotionally driven Mandopop and modern pop productions. Since her debut in 2023, she has developed a cross-genre catalog spanning Emo Pop, Dance Pop, EDM, and Lo-fi, while building a growing presence across Chinese and global streaming platforms.",
    mediumBio:
      "Cola B is a Mandarin pop singer-songwriter whose work centers on emotional storytelling, introspection, and the evolving relationship between human feeling and digital creation. Her music draws from pop, R&B, and alternative influences, delivered with a voice that balances vulnerability and confidence.",
    longBio:
      "Cola B is a Mandarin pop singer-songwriter whose work centers on emotional storytelling, introspection, and the evolving relationship between human feeling and digital creation.\n\nDebuting in 2023 through social media, Cola B quickly established her presence with cover releases that showcased her vocal tone and interpretation. By the end of the same year, she began transitioning into original songwriting, marking the beginning of her artistic identity as a creator.\n\nIn 2024, Cola B entered a period of rapid development. She received her first Spotify editorial playlist placement, signaling early industry recognition. During this time, she expanded beyond Mandopop into English pop, EDM, and Lo-fi, demonstrating a wide creative range while maintaining a consistent emotional core.\n\nHer music began gaining traction across Chinese digital platforms, with multiple tracks receiving widespread exposure and airplay. This growth positioned her as a cross-market artist with both local and global potential.\n\nIn 2025, Cola B further refined her identity through projects focused on emotional depth and narrative consistency. Releases during this period explored new tonal directions, including more provocative themes and genre experimentation, while reinforcing her foundation in emo Mandopop.\n\nEntering 2026, Cola B adopts a high-frequency release strategy, continuously expanding her catalog across multiple genres. Her work reflects a modern artist model — combining consistent output, evolving creative direction, and a growing connection with audiences across different markets.",
    positioning: [
      "Consistent music output",
      "Emotional storytelling",
      "Cross-genre versatility",
      "A growing global and Chinese audience",
    ],
    studioName: "Shiba Inu Media",
    studioStatement:
      "Shiba Inu Media is the independent creative studio behind Cola B — handling music production, visual direction, brand strategy, and digital world-building.",
  },
  "zh-HK": {
    name: "Cola B",
    tagline: "Emo Pop 女王",
    heroBody:
      "Cola B 是一位華語流行創作歌手，以細膩的情感敘事與現代流行音樂融合，打造出屬於她獨特的音樂世界。",
    shortBio:
      "Cola B 是一位華語流行創作歌手，以情感細膩的 Mandopop 作品見稱。自 2023 年出道以來，她已建立跨越 Emo Pop、Dance Pop、EDM 與 Lo-fi 的音樂版圖，並逐步拓展至全球市場。",
    mediumBio:
      "Cola B 是一位以情感敘事為核心的華語創作歌手，其音樂圍繞著愛情、回憶與自我反思。她的音樂汲取流行、R&B和另類音樂的靈感，以一種兼具脆弱和自信的聲音呈現。",
    longBio:
      "Cola B 是一位以情感敘事為核心的華語創作歌手，其音樂圍繞著愛情、回憶與自我反思。\n\n她於 2023 年透過社交媒體出道，最初以翻唱作品展現聲音與詮釋能力。其後於同年開始創作原創歌曲，逐步建立個人音樂風格。\n\n2024 年是 Cola B 快速成長的一年。她首次進入 Spotify 官方編輯歌單，獲得初步業界認可。同時，她開始拓展音樂風格，涵蓋英語流行、EDM 與 Lo-fi，展現跨類型創作能力。\n\n其作品亦逐漸在中國市場獲得關注，多首歌曲在平台上獲得傳播與播放，建立起跨地域的聽眾基礎。\n\n2025 年，Cola B 進一步深化音樂方向，推出更具情緒張力與風格探索的作品，同時持續鞏固其 Emo Mandopop 的核心定位。\n\n進入 2026 年，她採用高頻率發佈策略，持續推出新作品，建立龐大音樂庫並提升整體曝光與影響力。",
    positioning: [
      "穩定且持續的音樂輸出",
      "情感導向創作",
      "跨風格音樂能力",
      "中國與全球市場並行發展",
    ],
    studioName: "Shiba Inu Media",
    studioStatement:
      "Shiba Inu Media是Cola B背後的獨立創意工作室——負責音樂製作、視覺方向、品牌策略及數碼世界建設。",
  },
};

export const useBrand = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("zh") ? "zh-HK" : "en";
  return brandContent[lang];
};
