import type { Lang } from "@/lib/db/schema";

const dict = {
  talkToGrandma: { en: "Talk to Grandma", es: "Habla con la abuela", zh: "和外婆聊天", fr: "Parler à Grand-mère" },
  typeInstead: { en: "Type instead", es: "Mejor escribir", zh: "改为打字", fr: "Écrire plutôt" },
  useVoice: { en: "Use voice", es: "Usar voz", zh: "用语音", fr: "Utiliser la voix" },
  endChat: { en: "Say goodbye", es: "Despedirse", zh: "说再见", fr: "Dire au revoir" },
  menu: { en: "Menu", es: "Menú", zh: "菜单", fr: "Menu" },
  add: { en: "Add", es: "Añadir", zh: "添加", fr: "Ajouter" },
  cart: { en: "Your order", es: "Tu pedido", zh: "你的订单", fr: "Ta commande" },
  cartEmpty: { en: "Nothing yet. Grandma is waiting.", es: "Nada todavía. La abuela espera.", zh: "还没点呢，外婆在等你。", fr: "Rien pour l'instant. Grand-mère attend." },
  total: { en: "Total", es: "Total", zh: "总计", fr: "Total" },
  checkout: { en: "Order for pickup", es: "Pedir para recoger", zh: "下单到店自取", fr: "Commander à emporter" },
  payDemo: { en: "Pay (demo)", es: "Pagar (demo)", zh: "付款（演示）", fr: "Payer (démo)" },
  points: { en: "points", es: "puntos", zh: "积分", fr: "points" },
  loyaltyRule: { en: "100 points = a free coffee", es: "100 puntos = un café gratis", zh: "100积分 = 免费咖啡一杯", fr: "100 points = un café offert" },
  vote: { en: "Flavour of the month", es: "Sabor del mes", zh: "本月口味", fr: "Saveur du mois" },
  voteCta: { en: "Tap your favourite", es: "Toca tu favorito", zh: "点一下你的最爱", fr: "Touche ta préférée" },
  voted: { en: "You voted", es: "Votaste", zh: "你投了", fr: "Tu as voté" },
  suggestion: { en: "Suggestion box", es: "Buzón de sugerencias", zh: "意见箱", fr: "Boîte à idées" },
  suggestionPlaceholder: { en: "What should Grandma bake next?", es: "¿Qué debería hornear la abuela?", zh: "外婆接下来该烤点什么？", fr: "Que devrait cuisiner Grand-mère ?" },
  send: { en: "Send", es: "Enviar", zh: "发送", fr: "Envoyer" },
  thanks: { en: "Thank you, sweetheart.", es: "Gracias, cariño.", zh: "谢谢你，宝贝。", fr: "Merci, mon cœur." },
  allergens: { en: "Contains", es: "Contiene", zh: "含有", fr: "Contient" },
  allergenFree: { en: "No common allergens", es: "Sin alérgenos comunes", zh: "不含常见过敏原", fr: "Sans allergènes courants" },
  yourName: { en: "Your name (so Grandma remembers you)", es: "Tu nombre (para que la abuela te recuerde)", zh: "你的名字（让外婆记住你）", fr: "Ton prénom (pour que Grand-mère se souvienne)" },
  orderPlaced: { en: "Order placed", es: "Pedido realizado", zh: "下单成功", fr: "Commande passée" },
  pickupCode: { en: "Pickup code", es: "Código de recogida", zh: "取餐码", fr: "Code de retrait" },
  status: { en: "Status", es: "Estado", zh: "状态", fr: "Statut" },
  status_new: { en: "Grandma saw it", es: "La abuela lo vio", zh: "外婆看到了", fr: "Grand-mère l'a vu" },
  status_making: { en: "In the oven", es: "En el horno", zh: "在烤箱里", fr: "Au four" },
  status_ready: { en: "Ready, come get it", es: "Listo, ven por él", zh: "好了，快来拿", fr: "Prêt, viens le chercher" },
  status_picked_up: { en: "Picked up. Enjoy!", es: "Recogido. ¡Disfruta!", zh: "已取走，慢慢享用！", fr: "Récupéré. Régale-toi !" },
  grandmaSays: { en: "Grandma says", es: "La abuela dice", zh: "外婆说", fr: "Grand-mère dit" },
  listening: { en: "Listening...", es: "Escuchando...", zh: "在听呢...", fr: "J'écoute..." },
  connecting: { en: "Grandma is putting on her glasses...", es: "La abuela se está poniendo los lentes...", zh: "外婆正在戴眼镜...", fr: "Grand-mère met ses lunettes..." },
  voiceUnavailable: { en: "Grandma is resting her voice. Type to her instead.", es: "La abuela está descansando la voz. Escríbele.", zh: "外婆在休息嗓子，给她打字吧。", fr: "Grand-mère repose sa voix. Écris-lui plutôt." },
  typeMessage: { en: "Say something to Grandma", es: "Dile algo a la abuela", zh: "跟外婆说点什么", fr: "Dis quelque chose à Grand-mère" },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof dict;

export function t(key: StringKey, lang: Lang): string {
  return dict[key][lang] ?? dict[key].en;
}

export function pick(localized: Record<string, string> | undefined, lang: Lang): string {
  if (!localized) return "";
  return localized[lang] ?? localized.en ?? Object.values(localized)[0] ?? "";
}
