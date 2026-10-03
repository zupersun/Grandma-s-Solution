/* Copy for the Bakeria prototype, from PROMPT.md §8 (verbatim LANGS). */
export type BLang = "en" | "es" | "vi" | "zh";
export type Topic = "order" | "recipe" | "allergens" | "compliment" | "ask";

export const LANGS: Record<BLang, {
  name: string; code: string;
  order: string; recipe: string; compliment: string; ask: string; allergens: string; welcome: string;
  speaking: string; listening: string; idle: string; connecting: string;
  typeInstead: string; send: string; back: string; language: string;
  micOn: string; micStop: string; micOff: string;
  open: Record<Topic, string>;
}> = {
  en: {
    name: "English", code: "en-US",
    order: "Order ahead", recipe: "Suggest a recipe", compliment: "Give a compliment to Grandma", ask: "Ask anything!", allergens: "Ask about ingredients/allergens", welcome: "Come in, dear! What can I bake for you?",
    speaking: "Grandma is talking…", listening: "Listening… go ahead, dear", idle: "Tap the mic to talk to Grandma", connecting: "Grandma is putting on her glasses…",
    typeInstead: "Or type to Grandma…", send: "Send", back: "Back to home", language: "Language",
    micOn: "Talk to Grandma", micStop: "Stop listening",
    micOff: "The microphone isn’t available here, so type instead.",
    open: {
      order: "Hello dear! What would you like me to set aside for you, and when will you pick it up?",
      recipe: "Ooh, a recipe idea! Tell me what you’d love me to bake.",
      compliment: "Aww, you’ll make Grandma blush. Go on, tell me!",
      allergens: "Of course, dear. Which treat would you like to know about? I’ll tell you exactly what’s in it.",
      ask: "Ask me anything, sweetheart: what’s fresh today, what’s in it, anything at all.",
    },
  },
  es: {
    name: "Español", code: "es-ES",
    order: "Pedir con antelación", recipe: "Sugerir una receta", compliment: "Hacer un cumplido a la Abuela", ask: "¡Pregunta lo que sea!", allergens: "Preguntar por ingredientes/alérgenos", welcome: "¡Pasa, cariño! ¿Qué te horneo hoy?",
    speaking: "La Abuela está hablando…", listening: "Te escucho, cariño…", idle: "Toca el micrófono para hablar con la Abuela", connecting: "La Abuela se está poniendo los lentes…",
    typeInstead: "O escríbele a la Abuela…", send: "Enviar", back: "Volver al inicio", language: "Idioma",
    micOn: "Hablar con la Abuela", micStop: "Dejar de escuchar",
    micOff: "El micrófono no está disponible aquí; escribe tu mensaje.",
    open: {
      order: "¡Hola, cariño! ¿Qué quieres que te guarde y cuándo pasas a recogerlo?",
      recipe: "¡Una idea de receta! Cuéntame qué te gustaría que horneara.",
      compliment: "Ay, vas a hacer que me sonroje. ¡Cuéntame!",
      allergens: "Claro, cariño. ¿De qué dulce quieres saber? Te digo exactamente qué lleva.",
      ask: "Pregúntame lo que quieras, cariño: qué hay hoy, qué lleva, lo que sea.",
    },
  },
  vi: {
    name: "Tiếng Việt", code: "vi-VN",
    order: "Đặt trước", recipe: "Gợi ý công thức", compliment: "Gửi lời khen cho Bà", ask: "Hỏi gì cũng được!", allergens: "Hỏi về thành phần/dị ứng", welcome: "Vào đi con! Hôm nay con muốn ăn bánh gì?",
    speaking: "Bà đang nói…", listening: "Bà đang nghe đây con…", idle: "Chạm vào micro để nói chuyện với Bà", connecting: "Bà đang đeo kính…",
    typeInstead: "Hoặc nhắn cho Bà…", send: "Gửi", back: "Về trang chủ", language: "Ngôn ngữ",
    micOn: "Nói chuyện với Bà", micStop: "Dừng nghe",
    micOff: "Micro không dùng được ở đây, con nhắn tin nhé.",
    open: {
      order: "Chào con! Con muốn Bà để dành bánh gì, và khi nào con ghé lấy?",
      recipe: "Ồ, công thức mới hả! Con muốn Bà làm bánh gì nào?",
      compliment: "Trời ơi, con làm Bà ngại quá. Nói Bà nghe đi!",
      allergens: "Được chứ con. Con muốn hỏi bánh nào? Bà nói rõ trong đó có gì.",
      ask: "Con cứ hỏi Bà: hôm nay có bánh gì, bánh có gì trong đó, gì cũng được.",
    },
  },
  zh: {
    name: "中文", code: "zh-CN",
    order: "提前预订", recipe: "推荐食谱", compliment: "给外婆一句夸奖", ask: "随便问！", allergens: "问问配料/过敏原", welcome: "快进来，乖孩子！今天想吃点什么？",
    speaking: "外婆在说话…", listening: "外婆在听，你说吧…", idle: "点麦克风和外婆聊天", connecting: "外婆正在戴眼镜…",
    typeInstead: "或者打字给外婆…", send: "发送", back: "返回首页", language: "语言",
    micOn: "和外婆说话", micStop: "停止聆听",
    micOff: "这里用不了麦克风，请打字。",
    open: {
      order: "乖孩子你好！想让外婆给你留点什么？什么时候来拿？",
      recipe: "哦，有新食谱想法！告诉外婆你想吃什么。",
      compliment: "哎呀，外婆要脸红了。说吧！",
      allergens: "当然可以。你想问哪一款？外婆告诉你里面到底有什么。",
      ask: "什么都可以问外婆：今天有什么、里面有什么，都行。",
    },
  },
};

export const TOPICS: Topic[] = ["order", "recipe", "allergens", "compliment", "ask"];
