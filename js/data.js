/* ============================================================
 * PolyLingua 多语种学习平台 - 课程数据层
 * 涵盖英语 / 日语 / 韩语，按 CEFR 分级
 * ============================================================ */

const LANGUAGES = {
  en: { code: 'en', name: '英语', flag: '🇬🇧', native: 'English', tts: 'en-US', stt: 'en-US' },
  ja: { code: 'ja', name: '日语', flag: '🇯🇵', native: '日本語', tts: 'ja-JP', stt: 'ja-JP' },
  ko: { code: 'ko', name: '韩语', flag: '🇰🇷', native: '한국어', tts: 'ko-KR', stt: 'ko-KR' }
};

const LEVELS = [
  { code: 'A1', name: '入门', desc: '掌握基础词汇与日常简单表达' },
  { code: 'A2', name: '初级', desc: '能进行日常交流与基本对话' },
  { code: 'B1', name: '中级', desc: '能就熟悉话题流畅表达观点' },
  { code: 'B2', name: '中高级', desc: '能理解复杂文本并深入讨论' },
  { code: 'C1', name: '高级', desc: '灵活高效地运用语言' },
  { code: 'C2', name: '精通', desc: '近乎母语级别的精准表达' }
];

/* 课程内容 —— 每个课程包含若干节课，覆盖四种学习类型 */
const COURSES = [
  /* ---------------- 英语 ---------------- */
  {
    id: 'en-a1', lang: 'en', level: 'A1',
    title: '英语入门 · 日常会话', color: '#3b82f6',
    desc: '从零开始掌握英语发音、基础词汇与简单句型，能够进行自我介绍与日常问候。',
    lessons: [
      {
        id: 'en-a1-v1', title: '日常问候与礼貌用语', type: 'vocab', xp: 20,
        items: [
          { word: 'hello', phonetic: '/həˈloʊ/', pos: 'int.', meaning: '你好', example: 'Hello, how are you?', exampleTrans: '你好，你怎么样？' },
          { word: 'goodbye', phonetic: '/ˌɡʊdˈbaɪ/', pos: 'int.', meaning: '再见', example: 'Goodbye, see you tomorrow.', exampleTrans: '再见，明天见。' },
          { word: 'thank you', phonetic: '/ˈθæŋk juː/', pos: 'phrase', meaning: '谢谢', example: 'Thank you for your help.', exampleTrans: '谢谢你的帮助。' },
          { word: 'sorry', phonetic: '/ˈsɒri/', pos: 'adj.', meaning: '对不起', example: "I'm sorry I'm late.", exampleTrans: '对不起我迟到了。' },
          { word: 'please', phonetic: '/pliːz/', pos: 'adv.', meaning: '请', example: 'Please sit down.', exampleTrans: '请坐。' },
          { word: 'name', phonetic: '/neɪm/', pos: 'n.', meaning: '名字', example: 'My name is Tom.', exampleTrans: '我的名字叫汤姆。' },
          { word: 'friend', phonetic: '/frend/', pos: 'n.', meaning: '朋友', example: 'She is my best friend.', exampleTrans: '她是我最好的朋友。' },
          { word: 'welcome', phonetic: '/ˈwelkəm/', pos: 'adj.', meaning: '欢迎', example: 'You are welcome here.', exampleTrans: '欢迎你来到这里。' }
        ]
      },
      {
        id: 'en-a1-g1', title: 'be 动词与人称代词', type: 'grammar', xp: 20,
        items: [
          { q: '选择正确选项：I ___ a student.', type: 'mc', options: ['am', 'is', 'are', 'be'], answer: 'am', explain: '第一人称 I 搭配 am。' },
          { q: '选择正确选项：She ___ my sister.', type: 'mc', options: ['am', 'is', 'are', 'be'], answer: 'is', explain: '第三人称单数 she 搭配 is。' },
          { q: '填空（小写）：They ___ from China.', type: 'fill', answer: 'are', explain: '复数人称 they 搭配 are。' },
          { q: '填空（小写）：He ___ a teacher.', type: 'fill', answer: 'is', explain: '第三人称单数 he 搭配 is。' },
          { q: '选择正确选项：___ you a doctor?', type: 'mc', options: ['Am', 'Is', 'Are', 'Be'], answer: 'Are', explain: '第二人称 you 搭配 are。' },
          { q: '填空（小写）：We ___ happy today.', type: 'fill', answer: 'are', explain: '复数人称 we 搭配 are。' }
        ]
      },
      {
        id: 'en-a1-s1', title: '问候语口语跟读', type: 'speaking', xp: 25,
        items: [
          { text: 'Hello, nice to meet you.', translation: '你好，很高兴认识你。' },
          { text: 'Good morning, how are you?', translation: '早上好，你怎么样？' },
          { text: 'My name is Anna, what is your name?', translation: '我叫安娜，你叫什么名字？' },
          { text: 'Thank you very much, you are welcome.', translation: '非常感谢，不客气。' },
          { text: 'Goodbye, see you next time.', translation: '再见，下次见。' }
        ]
      },
      {
        id: 'en-a1-l1', title: '听对话 · 自我介绍', type: 'listening', xp: 25,
        items: [
          { audio: 'Hello, my name is David. I am from Canada. I am a teacher. Nice to meet you.', question: 'David 来自哪个国家？', options: ['美国', '加拿大', '英国', '澳大利亚'], answer: '加拿大', transcript: 'Hello, my name is David. I am from Canada. I am a teacher. Nice to meet you.' },
          { audio: 'Good morning. My name is Lucy. I am a student. I like reading books.', question: 'Lucy 的职业是什么？', options: ['老师', '医生', '学生', '护士'], answer: '学生', transcript: 'Good morning. My name is Lucy. I am a student. I like reading books.' },
          { audio: 'Hi, I am Mike. This is my friend Sarah. She is from Australia.', question: 'Sarah 来自哪里？', options: ['加拿大', '美国', '澳大利亚', '英国'], answer: '澳大利亚', transcript: 'Hi, I am Mike. This is my friend Sarah. She is from Australia.' }
        ]
      }
    ]
  },
  {
    id: 'en-a2', lang: 'en', level: 'A2',
    title: '英语初级 · 生活场景', color: '#2563eb',
    desc: '扩展日常生活词汇，学习一般现在时与过去时，能就购物、出行等场景进行简单对话。',
    lessons: [
      {
        id: 'en-a2-v1', title: '食物与餐饮', type: 'vocab', xp: 20,
        items: [
          { word: 'breakfast', phonetic: '/ˈbrekfəst/', pos: 'n.', meaning: '早餐', example: 'I have breakfast at seven.', exampleTrans: '我七点吃早餐。' },
          { word: 'vegetable', phonetic: '/ˈvedʒtəbl/', pos: 'n.', meaning: '蔬菜', example: 'Eat more vegetables.', exampleTrans: '多吃蔬菜。' },
          { word: 'delicious', phonetic: '/dɪˈlɪʃəs/', pos: 'adj.', meaning: '美味的', example: 'The soup is delicious.', exampleTrans: '这汤很美味。' },
          { word: 'menu', phonetic: '/ˈmenjuː/', pos: 'n.', meaning: '菜单', example: 'Can I see the menu?', exampleTrans: '我可以看一下菜单吗？' },
          { word: 'coffee', phonetic: '/ˈkɒfi/', pos: 'n.', meaning: '咖啡', example: 'A cup of coffee, please.', exampleTrans: '请来一杯咖啡。' },
          { word: 'dessert', phonetic: '/dɪˈzɜːt/', pos: 'n.', meaning: '甜点', example: 'What is for dessert?', exampleTrans: '甜点吃什么？' }
        ]
      },
      {
        id: 'en-a2-g1', title: '一般过去时', type: 'grammar', xp: 20,
        items: [
          { q: '选择正确选项：I ___ to school yesterday.', type: 'mc', options: ['go', 'went', 'gone', 'goes'], answer: 'went', explain: 'yesterday 提示过去时，go 的过去式为 went。' },
          { q: '填空（过去式，小写）：She ___ (visit) her grandma last week.', type: 'fill', answer: 'visited', explain: 'last week 提示过去时，visit 加 ed。' },
          { q: '选择正确选项：They ___ not at home last night.', type: 'mc', options: ['are', 'were', 'was', 'did'], answer: 'were', explain: '过去时复数用 were。' },
          { q: '填空（过去式，小写）：He ___ (eat) an apple this morning.', type: 'fill', answer: 'ate', explain: 'eat 的过去式为 ate。' },
          { q: '选择正确选项：___ you watch TV last night?', type: 'mc', options: ['Do', 'Did', 'Was', 'Were'], answer: 'Did', explain: '过去时一般疑问句用 Did。' }
        ]
      },
      {
        id: 'en-a2-s1', title: '餐厅点餐口语', type: 'speaking', xp: 25,
        items: [
          { text: 'A table for two, please.', translation: '请安排一张两人桌。' },
          { text: 'Could I have the menu, please?', translation: '请给我菜单好吗？' },
          { text: 'I would like a coffee and a sandwich.', translation: '我想要一杯咖啡和一个三明治。' },
          { text: 'The food here is really delicious.', translation: '这里的食物真好吃。' },
          { text: 'Can I have the bill, please?', translation: '请结账。' }
        ]
      },
      {
        id: 'en-a2-l1', title: '听对话 · 购物', type: 'listening', xp: 25,
        items: [
          { audio: 'Excuse me, how much is this shirt? It is forty dollars. I will take it.', question: '这件衬衫多少钱？', options: ['30 美元', '40 美元', '50 美元', '14 美元'], answer: '40 美元', transcript: 'Excuse me, how much is this shirt? It is forty dollars. I will take it.' },
          { audio: 'I need to buy some milk and bread. The supermarket closes at nine.', question: '超市几点关门？', options: ['8 点', '9 点', '10 点', '7 点'], answer: '9 点', transcript: 'I need to buy some milk and bread. The supermarket closes at nine.' }
        ]
      }
    ]
  },
  {
    id: 'en-b1', lang: 'en', level: 'B1',
    title: '英语中级 · 观点表达', color: '#1d4ed8',
    desc: '学习现在完成时与从句，能就旅行、工作等话题表达观点并描述经历。',
    lessons: [
      {
        id: 'en-b1-v1', title: '旅行与交通', type: 'vocab', xp: 20,
        items: [
          { word: 'journey', phonetic: '/ˈdʒɜːni/', pos: 'n.', meaning: '旅程', example: 'It was a long journey.', exampleTrans: '那是一段漫长的旅程。' },
          { word: 'destination', phonetic: '/ˌdestɪˈneɪʃn/', pos: 'n.', meaning: '目的地', example: 'Paris is a popular destination.', exampleTrans: '巴黎是热门目的地。' },
          { word: 'luggage', phonetic: '/ˈlʌɡɪdʒ/', pos: 'n.', meaning: '行李', example: 'Keep your luggage with you.', exampleTrans: '请随身携带行李。' },
          { word: 'departure', phonetic: '/dɪˈpɑːtʃə(r)/', pos: 'n.', meaning: '出发', example: 'Departure is at 6 am.', exampleTrans: '早上六点出发。' },
          { word: 'abroad', phonetic: '/əˈbrɔːd/', pos: 'adv.', meaning: '在国外', example: 'She studied abroad.', exampleTrans: '她在国外留学。' },
          { word: 'reservation', phonetic: '/ˌrezəˈveɪʃn/', pos: 'n.', meaning: '预订', example: 'I have a reservation.', exampleTrans: '我有预订。' }
        ]
      },
      {
        id: 'en-b1-g1', title: '现在完成时', type: 'grammar', xp: 20,
        items: [
          { q: '选择正确选项：I ___ already finished my homework.', type: 'mc', options: ['have', 'has', 'had', 'am'], answer: 'have', explain: 'I 搭配 have，already 常用于完成时。' },
          { q: '填空（小写）：She ___ (be) to Japan twice.', type: 'fill', answer: 'has been', explain: '第三人称单数用 has been。' },
          { q: '选择正确选项：___ you ever eaten sushi?', type: 'mc', options: ['Did', 'Have', 'Has', 'Do'], answer: 'Have', explain: 'ever 常与现在完成时搭配。' },
          { q: '填空（小写，完成时）：We ___ (live) here for ten years.', type: 'fill', answer: 'have lived', explain: 'for ten years 与现在完成时搭配。' }
        ]
      },
      {
        id: 'en-b1-s1', title: '旅行话题表达', type: 'speaking', xp: 25,
        items: [
          { text: 'I have always wanted to visit Japan.', translation: '我一直想去日本旅行。' },
          { text: 'What is the best way to get to the airport?', translation: '去机场最好的方式是什么？' },
          { text: 'I would recommend staying near the city center.', translation: '我建议住在市中心附近。' },
          { text: 'In my opinion, traveling alone is very rewarding.', translation: '在我看来，独自旅行很有收获。' }
        ]
      },
      {
        id: 'en-b1-l1', title: '听对话 · 旅行计划', type: 'listening', xp: 25,
        items: [
          { audio: 'I am planning to travel to Italy next summer. I have booked the flight and a hotel in Rome. I will stay there for a week.', question: '说话人将在罗马停留多久？', options: ['三天', '一周', '两周', '一个月'], answer: '一周', transcript: 'I am planning to travel to Italy next summer. I have booked the flight and a hotel in Rome. I will stay there for a week.' },
          { audio: 'My flight was delayed by two hours, so I missed the connecting train. I had to wait at the airport.', question: '说话人遇到了什么问题？', options: ['行李丢失', '航班延误', '酒店取消', '护照丢失'], answer: '航班延误', transcript: 'My flight was delayed by two hours, so I missed the connecting train. I had to wait at the airport.' }
        ]
      }
    ]
  },

  /* ---------------- 日语 ---------------- */
  {
    id: 'ja-a1', lang: 'ja', level: 'A1',
    title: '日语入门 · 五十音与寒暄', color: '#ef4444',
    desc: '学习平假名基础、日常寒暄语与简单自我介绍，迈出日语学习第一步。',
    lessons: [
      {
        id: 'ja-a1-v1', title: '日常寒暄语', type: 'vocab', xp: 20,
        items: [
          { word: 'こんにちは', phonetic: 'konnichiwa', pos: '感', meaning: '你好', example: 'こんにちは、はじめまして。', exampleTrans: '你好，初次见面。' },
          { word: 'ありがとう', phonetic: 'arigatou', pos: '感', meaning: '谢谢', example: 'どうもありがとう。', exampleTrans: '非常感谢。' },
          { word: 'すみません', phonetic: 'sumimasen', pos: '感', meaning: '对不起/劳驾', example: 'すみません、駅はどこですか。', exampleTrans: '请问，车站在哪里？' },
          { word: 'おはよう', phonetic: 'ohayou', pos: '感', meaning: '早上好', example: 'おはようございます。', exampleTrans: '早上好（礼貌）。' },
          { word: 'さようなら', phonetic: 'sayounara', pos: '感', meaning: '再见', example: 'じゃ、さようなら。', exampleTrans: '那么，再见。' },
          { word: 'はじめまして', phonetic: 'hajimemashite', pos: '感', meaning: '初次见面', example: 'はじめまして、よろしく。', exampleTrans: '初次见面，请多关照。' }
        ]
      },
      {
        id: 'ja-a1-g1', title: 'です/ます 基本句型', type: 'grammar', xp: 20,
        items: [
          { q: '选择正确选项：私は学生___。', type: 'mc', options: ['です', 'ます', 'だ', 'の'], answer: 'です', explain: '名词谓语句礼貌体用 です。' },
          { q: '填空（小写）：本を___(読む・ます形)。', type: 'fill', answer: '読みます', explain: '読む → 読みます。' },
          { q: '选择正确选项：これは___ですか。', type: 'mc', options: ['何', '誰', 'どこ', 'いつ'], answer: '何', explain: '询问事物用 何（なに/なん）。' },
          { q: '填空（小写）：田中さんは日本人___。', type: 'fill', answer: 'です', explain: '礼貌体名词谓语用 です。' },
          { q: '选择正确选项：毎日コーヒーを___。', type: 'mc', options: ['飲みます', '飲むです', '飲みです', '飲みま'], answer: '飲みます', explain: '动词ます形礼貌体。' }
        ]
      },
      {
        id: 'ja-a1-s1', title: '寒暄语口语跟读', type: 'speaking', xp: 25,
        items: [
          { text: 'こんにちは、はじめまして。', translation: '你好，初次见面。' },
          { text: 'おはようございます。', translation: '早上好。' },
          { text: 'ありがとうございます。', translation: '非常感谢。' },
          { text: 'すみません、もう一度お願いします。', translation: '对不起，请再说一遍。' },
          { text: 'さようなら、また明日。', translation: '再见，明天见。' }
        ]
      },
      {
        id: 'ja-a1-l1', title: '听对话 · 自我介绍', type: 'listening', xp: 25,
        items: [
          { audio: 'はじめまして。私は田中です。日本から来ました。会社員です。', question: '田中的职业是什么？', options: ['学生', '公司职员', '老师', '医生'], answer: '公司职员', transcript: 'はじめまして。私は田中です。日本から来ました。会社員です。' },
          { audio: 'おはようございます。私はキムです。韓国から来ました。留学生です。', question: 'キム 来自哪个国家？', options: ['日本', '中国', '韩国', '美国'], answer: '韩国', transcript: 'おはようございます。私はキムです。韓国から来ました。留学生です。' }
        ]
      }
    ]
  },
  {
    id: 'ja-a2', lang: 'ja', level: 'A2',
    title: '日语初级 · 生活表达', color: '#dc2626',
    desc: '学习形容词与 te 形，能描述事物并表达请求、许可等日常需求。',
    lessons: [
      {
        id: 'ja-a2-v1', title: '形容词与感受', type: 'vocab', xp: 20,
        items: [
          { word: 'おいしい', phonetic: 'oishii', pos: 'い adj', meaning: '好吃的', example: 'このりんごはおいしいです。', exampleTrans: '这个苹果很好吃。' },
          { word: 'たのしい', phonetic: 'tanoshii', pos: 'い adj', meaning: '快乐的', example: '旅行はたのしいです。', exampleTrans: '旅行很快乐。' },
          { word: 'きれい', phonetic: 'kirei', pos: 'な adj', meaning: '漂亮的', example: 'きれいな花ですね。', exampleTrans: '好漂亮的花啊。' },
          { word: 'ひま', phonetic: 'hima', pos: 'な adj', meaning: '空闲的', example: '今日はひまです。', exampleTrans: '今天有空。' },
          { word: 'むずかしい', phonetic: 'muzukashii', pos: 'い adj', meaning: '难的', example: '日本語はむずかしいです。', exampleTrans: '日语很难。' },
          { word: 'げんき', phonetic: 'genki', pos: 'な adj', meaning: '精神的', example: 'お元気ですか。', exampleTrans: '您身体好吗？' }
        ]
      },
      {
        id: 'ja-a2-g1', title: 'て 形与请求表达', type: 'grammar', xp: 20,
        items: [
          { q: '选择正确选项：ちょっと___ください。', type: 'mc', options: ['待って', '待つ', '待ち', '待った'], answer: '待って', explain: '请求句用 て 形 + ください。' },
          { q: '填空（小写，て形）：本を___(読む・て形)ください。', type: 'fill', answer: '読んで', explain: '読む → 読んで。' },
          { q: '选择正确选项：ここに写真を___もいいですか。', type: 'mc', options: ['はって', 'はる', 'はって', 'はり'], answer: 'はって', explain: '许可表达用 て形 + てもいいですか。' },
          { q: '填空（小写，て形）：窓を___(開ける・て形)ください。', type: 'fill', answer: '開けて', explain: '開ける → 開けて。' }
        ]
      },
      {
        id: 'ja-a2-s1', title: '请求与许可口语', type: 'speaking', xp: 25,
        items: [
          { text: 'ちょっと待ってください。', translation: '请稍等一下。' },
          { text: 'これを見てもいいですか。', translation: '我可以看看这个吗？' },
          { text: 'もう一度言ってください。', translation: '请再说一遍。' },
          { text: '写真を撮ってもいいですか。', translation: '可以拍照吗？' }
        ]
      },
      {
        id: 'ja-a2-l1', title: '听对话 · 餐厅点餐', type: 'listening', xp: 25,
        items: [
          { audio: 'すみません、ラーメンを一つお願いします。おいしかったです。ごちそうさまでした。', question: '说话人点了什么？', options: ['寿司', '拉面', '天妇罗', '咖喱'], answer: '拉面', transcript: 'すみません、ラーメンを一つお願いします。おいしかったです。ごちそうさまでした。' },
          { audio: 'この店はとてもきれいで、サービスもいいです。また来たいです。', question: '说话人对这家店的态度？', options: ['不满意', '想再来', '太贵', '想离开'], answer: '想再来', transcript: 'この店はとてもきれいで、サービスもいいです。また来たいです。' }
        ]
      }
    ]
  },

  /* ---------------- 韩语 ---------------- */
  {
    id: 'ko-a1', lang: 'ko', level: 'A1',
    title: '韩语入门 · 字母与问候', color: '#7c3aed',
    desc: '掌握韩文字母与基本发音，学习日常问候与自我介绍。',
    lessons: [
      {
        id: 'ko-a1-v1', title: '日常问候语', type: 'vocab', xp: 20,
        items: [
          { word: '안녕하세요', phonetic: 'annyeonghaseyo', pos: '感', meaning: '你好', example: '안녕하세요, 만나서 반갑습니다.', exampleTrans: '你好，很高兴见到你。' },
          { word: '감사합니다', phonetic: 'gamsahamnida', pos: '感', meaning: '谢谢', example: '도와주셔서 감사합니다.', exampleTrans: '感谢您的帮助。' },
          { word: '죄송합니다', phonetic: 'joesonghamnida', pos: '感', meaning: '对不起', example: '늦어서 죄송합니다.', exampleTrans: '对不起我迟到了。' },
          { word: '안녕히 가세요', phonetic: 'annyeonghi gaseyo', pos: '感', meaning: '再见（送客）', example: '안녕히 가세요.', exampleTrans: '请慢走。' },
          { word: '네', phonetic: 'ne', pos: '感', meaning: '是的', example: '네, 맞아요.', exampleTrans: '是的，没错。' },
          { word: '이름', phonetic: 'ireum', pos: '名', meaning: '名字', example: '이름이 뭐예요?', exampleTrans: '你叫什么名字？' }
        ]
      },
      {
        id: 'ko-a1-g1', title: '입니다 / 이에요 基本句型', type: 'grammar', xp: 20,
        items: [
          { q: '选择正确选项：저는 학생___.', type: 'mc', options: ['입니다', '이에요', '해요', '세요'], answer: '입니다', explain: '正式场合名词谓语用 입니다。' },
          { q: '填空（小写）：이것은 책___이에요.', type: 'fill', answer: '이', explain: '有收音名词用 이에요。' },
          { q: '选择正确选项：저는 한국사람___.', type: 'mc', options: ['입니다', '이에요', '해요', '이'], answer: '입니다', explain: '正式体用 입니다。' },
          { q: '填空（小写，无收音）：저는 학생___요.', type: 'fill', answer: '이에', explain: '无收音可省略，但有收音用 이에요。' },
          { q: '选择正确选项：이거 뭐___?', type: 'mc', options: ['예요', '이에요', '입니다', '해요'], answer: '예요', explain: '무엇+이에요 缩约为 뭐예요。' }
        ]
      },
      {
        id: 'ko-a1-s1', title: '问候语口语跟读', type: 'speaking', xp: 25,
        items: [
          { text: '안녕하세요, 만나서 반갑습니다.', translation: '你好，很高兴见到你。' },
          { text: '제 이름은 김민수입니다.', translation: '我叫金敏洙。' },
          { text: '감사합니다.', translation: '谢谢。' },
          { text: '죄송합니다, 다시 한 번 말씀해 주세요.', translation: '对不起，请再说一遍。' },
          { text: '안녕히 가세요.', translation: '再见（请慢走）。' }
        ]
      },
      {
        id: 'ko-a1-l1', title: '听对话 · 自我介绍', type: 'listening', xp: 25,
        items: [
          { audio: '안녕하세요. 저는 이영희입니다. 한국에서 왔어요. 저는 선생님입니다.', question: '이영희 的职业是什么？', options: ['学生', '老师', '医生', '公司职员'], answer: '老师', transcript: '안녕하세요. 저는 이영희입니다. 한국에서 왔어요. 저는 선생님입니다.' },
          { audio: '안녕하세요. 저는 왕밍입니다. 중국에서 왔어요. 저는 유학생입니다.', question: '왕밍 来自哪里？', options: ['韩国', '中国', '日本', '美国'], answer: '中国', transcript: '안녕하세요. 저는 왕밍입니다. 중국에서 왔어요. 저는 유학생입니다.' }
        ]
      }
    ]
  },
  {
    id: 'ko-a2', lang: 'ko', level: 'A2',
    title: '韩语初级 · 日常生活', color: '#6d28d9',
    desc: '学习时制与敬语表达，能描述日常活动并就购物、出行进行简单交流。',
    lessons: [
      {
        id: 'ko-a2-v1', title: '日常生活动词', type: 'vocab', xp: 20,
        items: [
          { word: '가다', phonetic: 'gada', pos: '动', meaning: '去', example: '학교에 가요.', exampleTrans: '我去学校。' },
          { word: '먹다', phonetic: 'meokda', pos: '动', meaning: '吃', example: '밥을 먹어요.', exampleTrans: '我吃饭。' },
          { word: '사다', phonetic: 'sada', pos: '动', meaning: '买', example: '과일을 사요.', exampleTrans: '我买水果。' },
          { word: '공부하다', phonetic: 'gongbuhada', pos: '动', meaning: '学习', example: '한국어를 공부해요.', exampleTrans: '我学韩语。' },
          { word: '만나다', phonetic: 'mannada', pos: '动', meaning: '见面', example: '친구를 만나요.', exampleTrans: '我见朋友。' },
          { word: '쉬다', phonetic: 'swida', pos: '动', meaning: '休息', example: '집에서 쉬어요.', exampleTrans: '我在家休息。' }
        ]
      },
      {
        id: 'ko-a2-g1', title: '时制 -았/었/해요', type: 'grammar', xp: 20,
        items: [
          { q: '选择正确选项：어제 영화를 ___.', type: 'mc', options: ['봤어요', '봐요', '볼 거예요', '봅니다'], answer: '봤어요', explain: '어제 提示过去时，用 봤어요。' },
          { q: '填空（小写，过去时）：어제 친구를 ___(만나다·过去).', type: 'fill', answer: '만났어요', explain: '만나다 → 만났어요。' },
          { q: '选择正确选项：내일 도서관에 ___.', type: 'mc', options: ['갔어요', '가요', '갈 거예요', '가세요'], answer: '갈 거예요', explain: '내일 提示将来时，用 갈 거예요。' },
          { q: '填空（小写，过去时）：어제 밥을 ___(먹다·过去).', type: 'fill', answer: '먹었어요', explain: '먹다 → 먹었어요。' }
        ]
      },
      {
        id: 'ko-a2-s1', title: '日常活动口语', type: 'speaking', xp: 25,
        items: [
          { text: '오늘 친구를 만나러 가요.', translation: '今天我去见朋友。' },
          { text: '어제 영화를 봤어요. 재미있었어요.', translation: '昨天看了电影，很有意思。' },
          { text: '내일 도서관에서 공부할 거예요.', translation: '明天我要在图书馆学习。' },
          { text: '주말에 쇼핑을 하고 싶어요.', translation: '周末我想去购物。' }
        ]
      },
      {
        id: 'ko-a2-l1', title: '听对话 · 周末计划', type: 'listening', xp: 25,
        items: [
          { audio: '주말에 친구랑 영화를 볼 거예요. 그리고 같이 밥을 먹을 거예요.', question: '说话人周末要做什么？', options: ['学习', '看电影和吃饭', '购物', '旅行'], answer: '看电影和吃饭', transcript: '주말에 친구랑 영화를 볼 거예요. 그리고 같이 밥을 먹을 거예요.' },
          { audio: '어제 날씨가 좋아서 산책했어요. 공원에서 친구를 만났어요.', question: '说话人昨天做了什么？', options: ['购物', '散步并见朋友', '看电影', '学习'], answer: '散步并见朋友', transcript: '어제 날씨가 좋아서 산책했어요. 공원에서 친구를 만났어요.' }
        ]
      }
    ]
  }
];

/* 个性化推荐规则：根据用户薄弱学习类型与进度生成路径 */
const RECOMMEND_RULES = {
  weakTypeBoost: { vocab: '词汇基础偏弱，建议多刷单词卡', grammar: '语法正确率待提升，强化语法练习', speaking: '口语跟读较少，建议每日跟读', listening: '听力需加强，多听多练' },
  nextLevel: '当前级别课程已掌握大部分，可挑战下一级别'
};

/* 成就定义 */
const ACHIEVEMENTS = [
  { id: 'first-step', icon: '🌱', name: '初出茅庐', desc: '完成第一节课', cond: (s) => s.completedLessonsCount >= 1 },
  { id: 'ten-lessons', icon: '📚', name: '勤学不辍', desc: '累计完成 10 节课', cond: (s) => s.completedLessonsCount >= 10 },
  { id: 'polyglot', icon: '🌐', name: '语言通才', desc: '在 3 种语言中各完成 1 节课', cond: (s) => s.langsTouched >= 3 },
  { id: 'streak-3', icon: '🔥', name: '连胜起步', desc: '连续学习 3 天', cond: (s) => s.maxStreak >= 3 },
  { id: 'streak-7', icon: '⚡', name: '一周不辍', desc: '连续学习 7 天', cond: (s) => s.maxStreak >= 7 },
  { id: 'xp-500', icon: '💎', name: '积分新秀', desc: '累计获得 500 经验', cond: (s) => s.xp >= 500 },
  { id: 'xp-2000', icon: '🏆', name: '积分达人', desc: '累计获得 2000 经验', cond: (s) => s.xp >= 2000 },
  { id: 'social-bird', icon: '💬', name: '社区新星', desc: '在社区发布第一条动态', cond: (s) => s.postsCount >= 1 },
  { id: 'master-speak', icon: '🎤', name: '开口达人', desc: '完成 5 节口语课', cond: (s) => s.speakingDone >= 5 },
  { id: 'listener', icon: '🎧', name: '倾听者', desc: '完成 5 节听力课', cond: (s) => s.listeningDone >= 5 }
];

/* 社区预置话题 */
const SEED_POSTS = [
  { id: 'p1', author: '小语', avatar: '🦊', lang: 'ja', title: '日语五十音背了好久还是记不住，大家有什么好方法吗？', content: '我已经背了一周，平假名还好，片假名总是混淆……求分享记忆技巧！', likes: 12, time: '2 小时前', comments: [
    { author: '樱花喵', avatar: '🐱', content: '可以按行分组，配合单词记忆会快很多～', time: '1 小时前' }
  ]},
  { id: 'p2', author: 'K-POP迷', avatar: '🐻', lang: 'ko', title: '通过听韩剧台词学韩语真的有用！', content: '最近追剧时跟着念台词，口语和听力都进步了不少，推荐大家试试影子跟读法。', likes: 28, time: '5 小时前', comments: [] },
  { id: 'p3', author: 'English Lover', avatar: '🐼', lang: 'en', title: '分享一个背单词的间隔重复法', content: '用艾宾浩斯曲线复习，第一天、第二天、第四天、第七天复习，效果惊人。', likes: 45, time: '1 天前', comments: [
    { author: '勤奋的蜗牛', avatar: '🐌', content: '太实用了，谢谢分享！', time: '20 小时前' }
  ]}
];

window.LANGUAGES = LANGUAGES;
window.LEVELS = LEVELS;
window.COURSES = COURSES;
window.RECOMMEND_RULES = RECOMMEND_RULES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.SEED_POSTS = SEED_POSTS;
