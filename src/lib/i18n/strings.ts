import type { Lang } from "@/lib/db/schema";

const dict = {
  talkToGrandma: { en: "Talk to Grandma", zh: "和外婆聊天", ko: "할머니와 이야기하기", vi: "Nói chuyện với Bà" },
  typeInstead: { en: "Type instead", zh: "改为打字", ko: "대신 입력하기", vi: "Nhập chữ thay vì nói" },
  useVoice: { en: "Use voice", zh: "用语音", ko: "음성으로 말하기", vi: "Dùng giọng nói" },
  endChat: { en: "Say goodbye", zh: "说再见", ko: "인사하고 끝내기", vi: "Chào tạm biệt" },
  menu: { en: "Menu", zh: "菜单", ko: "메뉴", vi: "Thực đơn" },
  add: { en: "Add", zh: "添加", ko: "담기", vi: "Thêm" },
  cart: { en: "Your order", zh: "你的订单", ko: "주문 내역", vi: "Đơn của bạn" },
  cartEmpty: { en: "Nothing yet. Grandma is waiting.", zh: "还没点呢，外婆在等你。", ko: "아직 비어 있어요. 할머니가 기다리세요.", vi: "Chưa có gì. Bà đang đợi đây." },
  total: { en: "Total", zh: "总计", ko: "합계", vi: "Tổng cộng" },
  checkout: { en: "Order for pickup", zh: "下单到店自取", ko: "포장 주문하기", vi: "Đặt để đến lấy" },
  payDemo: { en: "Pay (demo)", zh: "付款（演示）", ko: "결제 (체험)", vi: "Thanh toán (thử)" },
  points: { en: "points", zh: "积分", ko: "포인트", vi: "điểm" },
  loyaltyRule: { en: "100 points = a free coffee", zh: "100积分 = 免费咖啡一杯", ko: "100포인트 = 커피 한 잔 무료", vi: "100 điểm = một ly cà phê miễn phí" },
  vote: { en: "Flavour of the month", zh: "本月口味", ko: "이달의 맛", vi: "Vị của tháng" },
  voteCta: { en: "Tap your favourite", zh: "点一下你的最爱", ko: "좋아하는 맛을 눌러요", vi: "Chạm vào vị bạn thích" },
  voted: { en: "You voted", zh: "你投了", ko: "투표했어요", vi: "Bạn đã bình chọn" },
  suggestion: { en: "Suggestion box", zh: "意见箱", ko: "건의함", vi: "Hộp góp ý" },
  suggestionPlaceholder: { en: "What should Grandma bake next?", zh: "外婆接下来该烤点什么？", ko: "할머니가 다음에 무엇을 구울까요?", vi: "Bà nên nướng gì tiếp theo?" },
  send: { en: "Send", zh: "发送", ko: "보내기", vi: "Gửi" },
  thanks: { en: "Thank you, sweetheart.", zh: "谢谢你，宝贝。", ko: "고마워요, 우리 손님.", vi: "Cảm ơn con nhé." },
  allergens: { en: "Contains", zh: "含有", ko: "함유", vi: "Có chứa" },
  allergenFree: { en: "No common allergens", zh: "不含常见过敏原", ko: "흔한 알레르기 유발 성분 없음", vi: "Không có chất gây dị ứng thường gặp" },
  yourName: { en: "Your name (so Grandma remembers you)", zh: "你的名字（让外婆记住你）", ko: "이름 (할머니가 기억하시게요)", vi: "Tên của bạn (để Bà nhớ)" },
  orderPlaced: { en: "Order placed", zh: "下单成功", ko: "주문 완료", vi: "Đã đặt đơn" },
  pickupCode: { en: "Pickup code", zh: "取餐码", ko: "픽업 번호", vi: "Mã nhận hàng" },
  status: { en: "Status", zh: "状态", ko: "상태", vi: "Trạng thái" },
  status_new: { en: "Grandma saw it", zh: "外婆看到了", ko: "할머니가 확인하셨어요", vi: "Bà đã thấy rồi" },
  status_making: { en: "In the oven", zh: "在烤箱里", ko: "오븐에 들어갔어요", vi: "Đang trong lò" },
  status_ready: { en: "Ready, come get it", zh: "好了，快来拿", ko: "다 됐어요, 가져가세요", vi: "Xong rồi, đến lấy nhé" },
  status_picked_up: { en: "Picked up. Enjoy!", zh: "已取走，慢慢享用！", ko: "가져가셨어요. 맛있게 드세요!", vi: "Đã lấy. Chúc ngon miệng!" },
  grandmaSays: { en: "Grandma says", zh: "外婆说", ko: "할머니 말씀", vi: "Bà nói" },
  listening: { en: "Listening...", zh: "在听呢...", ko: "듣고 있어요...", vi: "Đang nghe..." },
  connecting: { en: "Grandma is putting on her glasses...", zh: "外婆正在戴眼镜...", ko: "할머니가 안경을 쓰고 계세요...", vi: "Bà đang đeo kính..." },
  voiceUnavailable: { en: "Grandma is resting her voice. Type to her instead.", zh: "外婆在休息嗓子，给她打字吧。", ko: "할머니가 목을 쉬고 계세요. 글로 말해 주세요.", vi: "Bà đang nghỉ giọng. Con nhập chữ nhé." },
  typeMessage: { en: "Say something to Grandma", zh: "跟外婆说点什么", ko: "할머니께 한마디 해보세요", vi: "Nói gì đó với Bà" },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof dict;

export function t(key: StringKey, lang: Lang): string {
  return dict[key][lang] ?? dict[key].en;
}

export function pick(localized: Record<string, string> | undefined, lang: Lang): string {
  if (!localized) return "";
  return localized[lang] ?? localized.en ?? Object.values(localized)[0] ?? "";
}
