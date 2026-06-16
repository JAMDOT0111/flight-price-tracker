export interface Airport {
  iata: string;
  nameZh: string;
  city: string;
  country: string;
  nameEn: string;
  keywords?: string[];
}

export const AIRPORTS: Airport[] = [
  // 台灣
  { iata: "TPE", nameZh: "台灣桃園國際機場", city: "台北", country: "台灣", nameEn: "Taipei Taoyuan Int'l", keywords: ["桃園", "台灣桃園"] },
  { iata: "TSA", nameZh: "台北松山機場", city: "台北", country: "台灣", nameEn: "Taipei Songshan", keywords: ["松山"] },
  { iata: "KHH", nameZh: "高雄國際機場", city: "高雄", country: "台灣", nameEn: "Kaohsiung Int'l", keywords: ["高雄"] },
  { iata: "TNN", nameZh: "台南機場", city: "台南", country: "台灣", nameEn: "Tainan Airport" },
  { iata: "RMQ", nameZh: "台中清泉崗機場", city: "台中", country: "台灣", nameEn: "Taichung Int'l", keywords: ["清泉崗"] },
  { iata: "HUN", nameZh: "花蓮機場", city: "花蓮", country: "台灣", nameEn: "Hualien Airport" },
  { iata: "TTT", nameZh: "台東機場", city: "台東", country: "台灣", nameEn: "Taitung Airport" },
  { iata: "MZG", nameZh: "馬公機場", city: "澎湖", country: "台灣", nameEn: "Magong Airport", keywords: ["馬公", "澎湖"] },
  { iata: "KNH", nameZh: "金門機場", city: "金門", country: "台灣", nameEn: "Kinmen Airport" },

  // 日本
  { iata: "NRT", nameZh: "東京成田國際機場", city: "東京", country: "日本", nameEn: "Tokyo Narita Int'l", keywords: ["成田", "Tokyo"] },
  { iata: "HND", nameZh: "東京羽田機場", city: "東京", country: "日本", nameEn: "Tokyo Haneda", keywords: ["羽田", "Tokyo"] },
  { iata: "TYO", nameZh: "東京（城市代碼）", city: "東京", country: "日本", nameEn: "Tokyo (city)", keywords: ["Tokyo", "成田", "羽田"] },
  { iata: "KIX", nameZh: "大阪關西國際機場", city: "大阪", country: "日本", nameEn: "Osaka Kansai Int'l", keywords: ["關西", "Kansai"] },
  { iata: "ITM", nameZh: "大阪伊丹機場", city: "大阪", country: "日本", nameEn: "Osaka Itami", keywords: ["伊丹"] },
  { iata: "OSA", nameZh: "大阪（城市代碼）", city: "大阪", country: "日本", nameEn: "Osaka (city)", keywords: ["關西", "伊丹"] },
  { iata: "CTS", nameZh: "札幌新千歲機場", city: "札幌", country: "日本", nameEn: "Sapporo Chitose", keywords: ["新千歲", "北海道"] },
  { iata: "FUK", nameZh: "福岡機場", city: "福岡", country: "日本", nameEn: "Fukuoka Airport" },
  { iata: "NGO", nameZh: "名古屋中部國際機場", city: "名古屋", country: "日本", nameEn: "Nagoya Centrair", keywords: ["中部"] },
  { iata: "OKA", nameZh: "沖繩那霸機場", city: "沖繩", country: "日本", nameEn: "Okinawa Naha", keywords: ["那霸"] },
  { iata: "SDJ", nameZh: "仙台機場", city: "仙台", country: "日本", nameEn: "Sendai Airport" },
  { iata: "HIJ", nameZh: "廣島機場", city: "廣島", country: "日本", nameEn: "Hiroshima Airport" },
  { iata: "KOJ", nameZh: "鹿兒島機場", city: "鹿兒島", country: "日本", nameEn: "Kagoshima Airport" },
  { iata: "KMJ", nameZh: "熊本機場", city: "熊本", country: "日本", nameEn: "Kumamoto Airport" },
  { iata: "OIT", nameZh: "大分機場", city: "大分", country: "日本", nameEn: "Oita Airport" },
  { iata: "MYJ", nameZh: "松山機場", city: "松山", country: "日本", nameEn: "Matsuyama Airport", keywords: ["愛媛"] },
  { iata: "TAK", nameZh: "高松機場", city: "高松", country: "日本", nameEn: "Takamatsu Airport", keywords: ["香川"] },
  { iata: "KIJ", nameZh: "新潟機場", city: "新潟", country: "日本", nameEn: "Niigata Airport" },
  { iata: "AOJ", nameZh: "青森機場", city: "青森", country: "日本", nameEn: "Aomori Airport" },
  { iata: "AXT", nameZh: "秋田機場", city: "秋田", country: "日本", nameEn: "Akita Airport" },
  { iata: "ISG", nameZh: "石垣機場", city: "石垣島", country: "日本", nameEn: "Ishigaki Airport" },
  { iata: "MMY", nameZh: "宮古機場", city: "宮古島", country: "日本", nameEn: "Miyako Airport" },

  // 韓國
  { iata: "ICN", nameZh: "首爾仁川國際機場", city: "首爾", country: "韓國", nameEn: "Seoul Incheon Int'l", keywords: ["仁川", "Seoul"] },
  { iata: "GMP", nameZh: "首爾金浦機場", city: "首爾", country: "韓國", nameEn: "Seoul Gimpo", keywords: ["金浦"] },
  { iata: "PUS", nameZh: "釜山金海國際機場", city: "釜山", country: "韓國", nameEn: "Busan Gimhae Int'l", keywords: ["金海", "Busan"] },
  { iata: "CJU", nameZh: "濟州國際機場", city: "濟州", country: "韓國", nameEn: "Jeju Int'l", keywords: ["Jeju"] },
  { iata: "TAE", nameZh: "大邱國際機場", city: "大邱", country: "韓國", nameEn: "Daegu Int'l" },

  // 中國
  { iata: "PEK", nameZh: "北京首都國際機場", city: "北京", country: "中國", nameEn: "Beijing Capital Int'l", keywords: ["首都"] },
  { iata: "PKX", nameZh: "北京大興國際機場", city: "北京", country: "中國", nameEn: "Beijing Daxing Int'l", keywords: ["大興"] },
  { iata: "PVG", nameZh: "上海浦東國際機場", city: "上海", country: "中國", nameEn: "Shanghai Pudong Int'l", keywords: ["浦東"] },
  { iata: "SHA", nameZh: "上海虹橋國際機場", city: "上海", country: "中國", nameEn: "Shanghai Hongqiao", keywords: ["虹橋"] },
  { iata: "CAN", nameZh: "廣州白雲國際機場", city: "廣州", country: "中國", nameEn: "Guangzhou Baiyun Int'l", keywords: ["白雲"] },
  { iata: "SZX", nameZh: "深圳寶安國際機場", city: "深圳", country: "中國", nameEn: "Shenzhen Bao'an Int'l", keywords: ["寶安"] },
  { iata: "CTU", nameZh: "成都雙流國際機場", city: "成都", country: "中國", nameEn: "Chengdu Shuangliu Int'l", keywords: ["雙流"] },
  { iata: "CKG", nameZh: "重慶江北國際機場", city: "重慶", country: "中國", nameEn: "Chongqing Jiangbei Int'l", keywords: ["江北"] },
  { iata: "XMN", nameZh: "廈門高崎國際機場", city: "廈門", country: "中國", nameEn: "Xiamen Gaoqi Int'l" },
  { iata: "KMG", nameZh: "昆明長水國際機場", city: "昆明", country: "中國", nameEn: "Kunming Changshui Int'l", keywords: ["長水"] },
  { iata: "HGH", nameZh: "杭州蕭山國際機場", city: "杭州", country: "中國", nameEn: "Hangzhou Xiaoshan Int'l", keywords: ["蕭山"] },
  { iata: "NKG", nameZh: "南京祿口國際機場", city: "南京", country: "中國", nameEn: "Nanjing Lukou Int'l" },
  { iata: "TSN", nameZh: "天津濱海國際機場", city: "天津", country: "中國", nameEn: "Tianjin Binhai Int'l" },
  { iata: "WUH", nameZh: "武漢天河國際機場", city: "武漢", country: "中國", nameEn: "Wuhan Tianhe Int'l" },

  // 香港、澳門
  { iata: "HKG", nameZh: "香港國際機場", city: "香港", country: "香港", nameEn: "Hong Kong Int'l", keywords: ["赤鱲角"] },
  { iata: "MFM", nameZh: "澳門國際機場", city: "澳門", country: "澳門", nameEn: "Macau Int'l" },

  // 東南亞 — 泰國
  { iata: "BKK", nameZh: "曼谷素萬那普國際機場", city: "曼谷", country: "泰國", nameEn: "Bangkok Suvarnabhumi", keywords: ["素萬那普", "Bangkok"] },
  { iata: "DMK", nameZh: "曼谷廊曼國際機場", city: "曼谷", country: "泰國", nameEn: "Bangkok Don Mueang", keywords: ["廊曼"] },
  { iata: "HKT", nameZh: "普吉島國際機場", city: "普吉", country: "泰國", nameEn: "Phuket Int'l", keywords: ["普吉", "Phuket"] },
  { iata: "CNX", nameZh: "清邁國際機場", city: "清邁", country: "泰國", nameEn: "Chiang Mai Int'l", keywords: ["Chiang Mai"] },
  { iata: "USM", nameZh: "蘇梅島機場", city: "蘇梅島", country: "泰國", nameEn: "Koh Samui Airport", keywords: ["蘇梅"] },
  { iata: "UTP", nameZh: "芭達雅烏塔帕機場", city: "芭達雅", country: "泰國", nameEn: "Pattaya U-Tapao", keywords: ["芭堤雅"] },

  // 東南亞 — 越南
  { iata: "SGN", nameZh: "胡志明市新山一國際機場", city: "胡志明市", country: "越南", nameEn: "Ho Chi Minh City Tan Son Nhat", keywords: ["新山一", "西貢", "Ho Chi Minh"] },
  { iata: "HAN", nameZh: "河內內排國際機場", city: "河內", country: "越南", nameEn: "Hanoi Noi Bai Int'l", keywords: ["內排", "Hanoi"] },
  { iata: "DAD", nameZh: "峴港國際機場", city: "峴港", country: "越南", nameEn: "Da Nang Int'l", keywords: ["Da Nang"] },
  { iata: "PQC", nameZh: "富國島國際機場", city: "富國島", country: "越南", nameEn: "Phu Quoc Int'l", keywords: ["Phu Quoc"] },
  { iata: "NHA", nameZh: "芽莊金蘭國際機場", city: "芽莊", country: "越南", nameEn: "Nha Trang Cam Ranh Int'l", keywords: ["金蘭"] },
  { iata: "HUI", nameZh: "順化富牌國際機場", city: "順化", country: "越南", nameEn: "Hue Phu Bai Int'l" },

  // 東南亞 — 新加坡、馬來西亞
  { iata: "SIN", nameZh: "新加坡樟宜國際機場", city: "新加坡", country: "新加坡", nameEn: "Singapore Changi", keywords: ["樟宜", "Singapore"] },
  { iata: "KUL", nameZh: "吉隆坡國際機場", city: "吉隆坡", country: "馬來西亞", nameEn: "Kuala Lumpur Int'l", keywords: ["KLIA", "Malaysia"] },
  { iata: "PEN", nameZh: "檳城國際機場", city: "檳城", country: "馬來西亞", nameEn: "Penang Int'l", keywords: ["Penang"] },
  { iata: "BKI", nameZh: "哥打基納巴盧國際機場", city: "哥打基納巴盧", country: "馬來西亞", nameEn: "Kota Kinabalu Int'l", keywords: ["沙巴", "KK"] },
  { iata: "KCH", nameZh: "古晉國際機場", city: "古晉", country: "馬來西亞", nameEn: "Kuching Int'l", keywords: ["砂拉越"] },
  { iata: "JHB", nameZh: "新山士乃國際機場", city: "新山", country: "馬來西亞", nameEn: "Johor Bahru Senai Int'l" },

  // 東南亞 — 菲律賓、印尼
  { iata: "MNL", nameZh: "馬尼拉尼諾伊·阿基諾國際機場", city: "馬尼拉", country: "菲律賓", nameEn: "Manila Ninoy Aquino Int'l", keywords: ["Manila", "NAIA"] },
  { iata: "CEB", nameZh: "宿霧麥克坦國際機場", city: "宿霧", country: "菲律賓", nameEn: "Cebu Mactan Int'l", keywords: ["麥克坦", "Cebu"] },
  { iata: "DPS", nameZh: "峇里島恩古拉萊國際機場", city: "峇里島", country: "印尼", nameEn: "Bali Ngurah Rai Int'l", keywords: ["巴厘島", "Bali", "Denpasar"] },
  { iata: "CGK", nameZh: "雅加達蘇加諾-哈達國際機場", city: "雅加達", country: "印尼", nameEn: "Jakarta Soekarno-Hatta Int'l", keywords: ["Jakarta"] },
  { iata: "SUB", nameZh: "泗水朱安達國際機場", city: "泗水", country: "印尼", nameEn: "Surabaya Juanda Int'l" },
  { iata: "LOP", nameZh: "龍目島國際機場", city: "龍目島", country: "印尼", nameEn: "Lombok Int'l", keywords: ["Lombok"] },

  // 東南亞 — 其他
  { iata: "RGN", nameZh: "仰光國際機場", city: "仰光", country: "緬甸", nameEn: "Yangon Int'l", keywords: ["Yangon"] },
  { iata: "REP", nameZh: "暹粒吳哥國際機場", city: "暹粒", country: "柬埔寨", nameEn: "Siem Reap Angkor Int'l", keywords: ["吳哥窟", "Siem Reap"] },
  { iata: "PNH", nameZh: "金邊國際機場", city: "金邊", country: "柬埔寨", nameEn: "Phnom Penh Int'l", keywords: ["Phnom Penh"] },
  { iata: "VTE", nameZh: "永珍瓦岱國際機場", city: "永珍", country: "寮國", nameEn: "Vientiane Wattay Int'l", keywords: ["Vientiane"] },
  { iata: "LPQ", nameZh: "琅勃拉邦國際機場", city: "琅勃拉邦", country: "寮國", nameEn: "Luang Prabang Int'l" },

  // 南亞
  { iata: "DEL", nameZh: "新德里英迪拉·甘地國際機場", city: "新德里", country: "印度", nameEn: "Delhi Indira Gandhi Int'l", keywords: ["Delhi"] },
  { iata: "BOM", nameZh: "孟買查特拉帕蒂·希瓦吉國際機場", city: "孟買", country: "印度", nameEn: "Mumbai Chhatrapati Shivaji Int'l", keywords: ["Mumbai"] },
  { iata: "CMB", nameZh: "可倫坡班達拉奈克國際機場", city: "可倫坡", country: "斯里蘭卡", nameEn: "Colombo Bandaranaike Int'l", keywords: ["斯里蘭卡", "Colombo"] },
  { iata: "MLE", nameZh: "馬爾地夫維拉納國際機場", city: "馬累", country: "馬爾地夫", nameEn: "Maldives Velana Int'l", keywords: ["馬爾地夫", "Maldives"] },

  // 中東
  { iata: "DXB", nameZh: "杜拜國際機場", city: "杜拜", country: "阿聯酋", nameEn: "Dubai Int'l", keywords: ["Dubai", "UAE"] },
  { iata: "AUH", nameZh: "阿布達比國際機場", city: "阿布達比", country: "阿聯酋", nameEn: "Abu Dhabi Int'l", keywords: ["Abu Dhabi"] },
  { iata: "DOH", nameZh: "多哈哈馬德國際機場", city: "多哈", country: "卡達", nameEn: "Doha Hamad Int'l", keywords: ["Qatar", "卡達"] },
  { iata: "IST", nameZh: "伊斯坦堡機場", city: "伊斯坦堡", country: "土耳其", nameEn: "Istanbul Airport", keywords: ["Istanbul", "Turkey"] },

  // 大洋洲
  { iata: "SYD", nameZh: "雪梨金斯福德·史密斯國際機場", city: "雪梨", country: "澳洲", nameEn: "Sydney Kingsford Smith Int'l", keywords: ["Sydney", "悉尼"] },
  { iata: "MEL", nameZh: "墨爾本國際機場", city: "墨爾本", country: "澳洲", nameEn: "Melbourne Int'l", keywords: ["Melbourne"] },
  { iata: "BNE", nameZh: "布里斯本國際機場", city: "布里斯本", country: "澳洲", nameEn: "Brisbane Int'l", keywords: ["Brisbane"] },
  { iata: "PER", nameZh: "伯斯機場", city: "伯斯", country: "澳洲", nameEn: "Perth Airport", keywords: ["Perth"] },
  { iata: "AKL", nameZh: "奧克蘭國際機場", city: "奧克蘭", country: "紐西蘭", nameEn: "Auckland Int'l", keywords: ["Auckland"] },
  { iata: "GUM", nameZh: "關島國際機場", city: "關島", country: "關島", nameEn: "Guam Int'l", keywords: ["Guam"] },

  // 北美
  { iata: "LAX", nameZh: "洛杉磯國際機場", city: "洛杉磯", country: "美國", nameEn: "Los Angeles Int'l", keywords: ["LA"] },
  { iata: "SFO", nameZh: "舊金山國際機場", city: "舊金山", country: "美國", nameEn: "San Francisco Int'l" },
  { iata: "JFK", nameZh: "紐約甘迺迪國際機場", city: "紐約", country: "美國", nameEn: "New York JFK", keywords: ["New York", "紐約"] },
  { iata: "EWR", nameZh: "紐瓦克自由國際機場", city: "紐約", country: "美國", nameEn: "Newark Liberty Int'l", keywords: ["Newark", "紐約"] },
  { iata: "ORD", nameZh: "芝加哥歐海爾國際機場", city: "芝加哥", country: "美國", nameEn: "Chicago O'Hare Int'l" },
  { iata: "SEA", nameZh: "西雅圖-塔科馬國際機場", city: "西雅圖", country: "美國", nameEn: "Seattle-Tacoma Int'l" },
  { iata: "YVR", nameZh: "溫哥華國際機場", city: "溫哥華", country: "加拿大", nameEn: "Vancouver Int'l" },
  { iata: "YYZ", nameZh: "多倫多皮爾遜國際機場", city: "多倫多", country: "加拿大", nameEn: "Toronto Pearson Int'l" },

  // 歐洲
  { iata: "LHR", nameZh: "倫敦希斯羅機場", city: "倫敦", country: "英國", nameEn: "London Heathrow", keywords: ["Heathrow"] },
  { iata: "CDG", nameZh: "巴黎戴高樂機場", city: "巴黎", country: "法國", nameEn: "Paris Charles de Gaulle", keywords: ["Paris"] },
  { iata: "FRA", nameZh: "法蘭克福機場", city: "法蘭克福", country: "德國", nameEn: "Frankfurt Airport" },
  { iata: "AMS", nameZh: "阿姆斯特丹史基浦機場", city: "阿姆斯特丹", country: "荷蘭", nameEn: "Amsterdam Schiphol" },
  { iata: "ZRH", nameZh: "蘇黎世機場", city: "蘇黎世", country: "瑞士", nameEn: "Zurich Airport" },
  { iata: "FCO", nameZh: "羅馬菲烏米奇諾機場", city: "羅馬", country: "義大利", nameEn: "Rome Fiumicino" },
  { iata: "BCN", nameZh: "巴塞隆納埃爾普拉特機場", city: "巴塞隆納", country: "西班牙", nameEn: "Barcelona El Prat" },
];

/** 搜尋機場（IATA 前綴、中文名、城市、國家、關鍵字） */
export function searchAirports(query: string, maxResults = 8): Airport[] {
  const q = query.trim();
  if (!q) return [];
  const upper = q.toUpperCase();
  const lower = q.toLowerCase();

  const scored = AIRPORTS.map((a) => {
    let score = 0;
    // IATA 完全匹配最高分
    if (a.iata === upper) score += 100;
    else if (a.iata.startsWith(upper)) score += 50;
    // 中文城市名完全匹配
    if (a.city === q) score += 80;
    else if (a.city.includes(q)) score += 40;
    // 中文機場名
    if (a.nameZh.includes(q)) score += 30;
    // 國家名
    if (a.country.includes(q)) score += 10;
    // 英文名（不分大小寫）
    if (a.nameEn.toLowerCase().includes(lower)) score += 20;
    // 自訂關鍵字
    if (a.keywords?.some((k) => k.toLowerCase().includes(lower) || k.includes(q))) score += 35;
    return { airport: a, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.airport);
}
