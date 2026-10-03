/* Copy for the Bakeria prototype, from PROMPT.md §8 (verbatim LANGS). */
export type BLang = "en" | "ko" | "vi" | "zh";
export type Topic = "order" | "recipe" | "allergens" | "compliment" | "ask";

export const LANGS: Record<BLang, {
  name: string; code: string;
  order: string; recipe: string; compliment: string; ask: string; allergens: string; welcome: string;
  speaking: string; listening: string; idle: string; connecting: string;
  typeInstead: string; send: string; back: string; language: string;
  micOn: string; micStop: string; micOff: string; talkToGrandma: string; hello: string;
  open: Record<Topic, string>;
}> = {
  en: {
    name: "English", code: "en-US",
    order: "Order ahead", recipe: "Suggest a recipe", compliment: "Give a compliment to Grandma", ask: "Ask anything!", allergens: "Ask about ingredients/allergens", welcome: "Come in, dear! What can I bake for you?",
    speaking: "Grandma is talking…", listening: "Listening… go ahead, dear", idle: "Tap the mic to talk to Grandma", connecting: "Grandma is putting on her glasses…",
    typeInstead: "Or type to Grandma…", send: "Send", back: "Back to home", language: "Language",
    micOn: "Talk to Grandma", micStop: "Stop listening",
    micOff: "The microphone isn’t available here, so type instead.",
    talkToGrandma: "Chat with Grandma", hello: "Come in, dear. What can I get you?",
    open: {
      order: "Hello dear! What would you like me to set aside for you, and when will you pick it up?",
      recipe: "Ooh, a recipe idea! Tell me what you’d love me to bake.",
      compliment: "Aww, you’ll make Grandma blush. Go on, tell me!",
      allergens: "Of course, dear. Which treat would you like to know about? I’ll tell you exactly what’s in it.",
      ask: "Ask me anything, sweetheart: what’s fresh today, what’s in it, anything at all.",
    },
  },
  ko: {
    name: "한국어", code: "ko-KR",
    order: "미리 주문하기", recipe: "레시피 추천하기", compliment: "할머니께 칭찬 한마디", ask: "뭐든지 물어보세요!", allergens: "재료와 알레르기 묻기", welcome: "어서 오렴! 오늘은 뭘 구워 줄까?",
    speaking: "할머니가 말하고 있어요…", listening: "듣고 있단다, 말해 보렴…", idle: "마이크를 눌러 할머니와 이야기하세요", connecting: "할머니가 안경을 쓰고 계세요…",
    typeInstead: "할머니께 글로 남기기…", send: "보내기", back: "처음으로", language: "언어",
    micOn: "할머니와 이야기하기", micStop: "그만 듣기",
    micOff: "여기서는 마이크를 쓸 수 없어요. 글로 적어 주세요.",
    talkToGrandma: "할머니와 이야기하기", hello: "어서 오렴. 뭘 줄까?",
    open: {
      order: "안녕, 우리 아가! 무엇을 따로 담아 둘까? 언제 가지러 올 거니?",
      recipe: "오, 레시피 아이디어구나! 무엇을 구워 주면 좋을지 말해 보렴.",
      compliment: "아이고, 할머니 부끄럽구나. 어서 말해 보렴!",
      allergens: "그럼, 물론이지. 어떤 걸 알고 싶니? 무엇이 들었는지 정확히 알려 줄게.",
      ask: "뭐든지 물어보렴. 오늘 갓 나온 것, 재료, 무엇이든 괜찮단다.",
    },
  },
  vi: {
    name: "Tiếng Việt", code: "vi-VN",
    order: "Đặt trước", recipe: "Gợi ý công thức", compliment: "Gửi lời khen cho Bà", ask: "Hỏi gì cũng được!", allergens: "Hỏi về thành phần/dị ứng", welcome: "Vào đi con! Hôm nay con muốn ăn bánh gì?",
    speaking: "Bà đang nói…", listening: "Bà đang nghe đây con…", idle: "Chạm vào micro để nói chuyện với Bà", connecting: "Bà đang đeo kính…",
    typeInstead: "Hoặc nhắn cho Bà…", send: "Gửi", back: "Về trang chủ", language: "Ngôn ngữ",
    micOn: "Nói chuyện với Bà", micStop: "Dừng nghe",
    micOff: "Micro không dùng được ở đây, con nhắn tin nhé.",
    talkToGrandma: "Nói chuyện với Bà", hello: "Vào đi con. Con muốn gì nào?",
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
    talkToGrandma: "和外婆聊天", hello: "快进来，乖孩子。想要点什么？",
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
