import { useTranslation } from "react-i18next";

const brandContent = {
  en: {
    name: "Cola B",
    tagline: "Singer-songwriter. Cultural personality. A world built through music, style, and moments.",
    shortBio:
      "Cola B is a singer-songwriter and digital cultural personality whose world spans music, lifestyle, travel, and modern internet life.",
    mediumBio:
      "Cola B is a singer-songwriter and digital cultural personality building a world through music, style, cities, and modern internet life. Her work blends emotional songwriting with a cinematic visual identity — creating an artist universe that extends far beyond the music itself. Every release is a chapter, every moment is a story.",
    longBio:
      "Cola B is a singer-songwriter and digital cultural personality whose creative universe spans music, lifestyle, travel, luxury aesthetics, humor, and storytelling. Her artistry is rooted in emotional, contemporary songwriting — but her world extends into every corner of modern culture. From city streets to studio sessions, from fashion to humor, Cola B builds a living, breathing world that invites audiences to step inside.\n\nHer music draws from pop, R&B, and alternative influences, delivered with a voice that balances vulnerability and confidence. Each release is conceived as part of a larger narrative — an era, a mood, a visual identity. Cola B doesn't just release songs; she releases worlds.\n\nAs a digital personality, she brings the same intentionality to her online presence: stylish, culturally aware, emotionally intelligent, and always unmistakably herself. Cola B is the headquarters of a new kind of artist — one whose brand, music, and life are inseparable.",
    studioName: "Shiba Inu Media",
    studioStatement:
      "Shiba Inu Media is the independent creative studio behind Cola B — handling music production, visual direction, brand strategy, and digital world-building.",
  },
  "zh-HK": {
    name: "Cola B",
    tagline: "創作歌手。文化個性。以音樂、風格和生活時刻構建的世界。",
    shortBio:
      "Cola B是一位創作歌手及數碼文化人物，她的世界涵蓋音樂、生活品味、旅行及現代網絡生活。",
    mediumBio:
      "Cola B是一位創作歌手及數碼文化人物，以音樂、風格、城市和現代網絡生活構建她的世界。她的作品融合了感性的創作與電影般的視覺風格——打造出一個超越音樂本身的藝術宇宙。每一首發佈是一個章節，每一個瞬間是一個故事。",
    longBio:
      "Cola B是一位創作歌手及數碼文化人物，她的創意宇宙涵蓋音樂、生活品味、旅行、奢華美學、幽默感和故事敘述。她的藝術根植於感性的當代創作——但她的世界延伸到現代文化的每一個角落。從城市街頭到錄音室，從時尚到幽默，Cola B打造了一個充滿生命力的世界，邀請觀眾走進其中。\n\n她的音樂汲取流行、R&B和另類音樂的靈感，以一種兼具脆弱和自信的聲音呈現。每一次發佈都被構想為更大敘事的一部分——一個時代、一種情緒、一個視覺身份。Cola B不僅僅是發佈歌曲；她發佈的是一個個世界。\n\n作為數碼人物，她以同樣的用心經營她的網絡存在：時尚、文化敏銳、情感智慧，而且永遠獨特地做自己。Cola B是新一代藝人的代表——品牌、音樂和生活融為一體。",
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
