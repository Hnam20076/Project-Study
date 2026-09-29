import {
  subjectRepo,
  topicRepo,
  notebookRepo,
  sectionRepo,
  pageRepo,
  scheduleRepo,
  mindmapRepo,
  knowledgeNodeRepo,
  knowledgeEdgeRepo,
  questionRepo,
  formulaRepo,
  componentRepo,
} from './repositories'

// Cờ kiểm tra đã seed chưa (lưu localStorage thay vì IndexedDB để kiểm tra nhanh)
const SEED_KEY = 'study_os_seeded_v5'

/**
 * Nạp dữ liệu mẫu tiếng Việt khi khởi chạy lần đầu
 * Chỉ chạy một lần, được đánh cờ isDemo = true
 */
export async function seedDemoDataIfNeeded(): Promise<void> {
  const [qCount, cCount, fCount, sCount] = await Promise.all([
    questionRepo.getAll().then(a => a.length).catch(() => 0),
    componentRepo.getAll().then(a => a.length).catch(() => 0),
    formulaRepo.getAll().then(a => a.length).catch(() => 0),
    subjectRepo.getAll().then(a => a.length).catch(() => 0),
  ])
  const alreadySeeded = localStorage.getItem(SEED_KEY)

  // Nếu chưa seed phiên bản v5 HOẶC bất kỳ bảng cốt lõi nào bị thiếu dữ liệu
  if (!alreadySeeded || qCount < 7 || cCount === 0 || fCount === 0 || sCount === 0) {
    await seedDemoData()
    localStorage.setItem(SEED_KEY, 'true')
  }
}

export async function seedDemoData(): Promise<void> {
  // === Subjects ===
  const existingSubjects = await subjectRepo.getAll()
  let mathSubject = existingSubjects.find(s => s.code === 'MATH301')
  if (!mathSubject) {
    mathSubject = await subjectRepo.create({
      name: 'Toán Kỹ Thuật',
      code: 'MATH301',
      color: '#6366f1',
      description: 'Giải tích, đại số tuyến tính, xác suất thống kê',
      semester: 'HK1-2024',
      tags: ['toán', 'kỹ thuật'],
      isDemo: true,
    })
  }

  let physicsSubject = existingSubjects.find(s => s.code === 'PHYS201')
  if (!physicsSubject) {
    physicsSubject = await subjectRepo.create({
      name: 'Vật Lý Đại Cương',
      code: 'PHYS201',
      color: '#10b981',
      description: 'Cơ học, nhiệt học, điện từ, quang học',
      semester: 'HK1-2024',
      tags: ['vật lý', 'đại cương'],
      isDemo: true,
    })
  }

  let electronicsSubject = existingSubjects.find(s => s.code === 'ELEC101')
  if (!electronicsSubject) {
    electronicsSubject = await subjectRepo.create({
      name: 'Điện Tử Cơ Bản',
      code: 'ELEC101',
      color: '#f59e0b',
      description: 'Linh kiện điện tử, mạch điện cơ bản',
      semester: 'HK1-2024',
      tags: ['điện tử', 'mạch'],
      isDemo: true,
    })
  }

  // === Topics ===
  const existingTopics = await topicRepo.getAll()
  let mathTopic1 = existingTopics.find(t => t.name === 'Đạo hàm' && t.subjectId === mathSubject.id)
  if (!mathTopic1) {
    mathTopic1 = await topicRepo.create({
      name: 'Đạo hàm',
      subjectId: mathSubject.id,
      description: 'Khái niệm, quy tắc tính đạo hàm',
      order: 1,
      tags: ['giải tích'],
      isDemo: true,
    })
  }

  let mathTopic2 = existingTopics.find(t => t.name === 'Tích phân' && t.subjectId === mathSubject.id)
  if (!mathTopic2) {
    mathTopic2 = await topicRepo.create({
      name: 'Tích phân',
      subjectId: mathSubject.id,
      description: 'Tích phân xác định và bất định',
      order: 2,
      tags: ['giải tích'],
      isDemo: true,
    })
  }

  let physTopic1 = existingTopics.find(t => t.name === 'Cơ học Newton' && t.subjectId === physicsSubject.id)
  if (!physTopic1) {
    physTopic1 = await topicRepo.create({
      name: 'Cơ học Newton',
      subjectId: physicsSubject.id,
      description: 'Ba định luật Newton và ứng dụng',
      order: 1,
      tags: ['cơ học', 'newton'],
      isDemo: true,
    })
  }

  let physTopic2 = existingTopics.find(t => t.name === 'Dao động điều hòa' && t.subjectId === physicsSubject.id)
  if (!physTopic2) {
    physTopic2 = await topicRepo.create({
      name: 'Dao động điều hòa',
      subjectId: physicsSubject.id,
      description: 'Phương trình dao động, con lắc lò xo và con lắc đơn',
      order: 2,
      tags: ['dao động', 'vật lý'],
      isDemo: true,
    })
  }

  let elecTopic1 = existingTopics.find(t => t.name === 'Định luật Ôm' && t.subjectId === electronicsSubject.id)
  if (!elecTopic1) {
    elecTopic1 = await topicRepo.create({
      name: 'Định luật Ôm',
      subjectId: electronicsSubject.id,
      description: 'U = I × R và mạch phân áp',
      order: 1,
      tags: ['mạch', 'điện'],
      isDemo: true,
    })
  }

  let elecTopic2 = existingTopics.find(t => t.name === 'Mạch RC & Quá độ' && t.subjectId === electronicsSubject.id)
  if (!elecTopic2) {
    elecTopic2 = await topicRepo.create({
      name: 'Mạch RC & Quá độ',
      subjectId: electronicsSubject.id,
      description: 'Quá trình nạp xả tụ điện và hằng số thời gian tau',
      order: 2,
      tags: ['quá độ', 'rc'],
      isDemo: true,
    })
  }

  // === Notebooks ===
  const mathNotebook = await notebookRepo.create({
    name: 'Toán Kỹ Thuật',
    color: '#6366f1',
    order: 1,
    tags: ['toán'],
    isDemo: true,
    subjectId: mathSubject.id,
  })

  const physicsNotebook = await notebookRepo.create({
    name: 'Vật Lý Đại Cương',
    color: '#10b981',
    order: 2,
    tags: ['vật lý'],
    isDemo: true,
    subjectId: physicsSubject.id,
  })

  // === Sections ===
  const chapter1 = await sectionRepo.create({
    name: 'Chương 1: Đạo hàm',
    notebookId: mathNotebook.id,
    order: 1,
    tags: [],
    isDemo: true,
  })

  await sectionRepo.create({
    name: 'Chương 2: Tích phân',
    notebookId: mathNotebook.id,
    order: 2,
    tags: [],
    isDemo: true,
  })

  const physSection = await sectionRepo.create({
    name: 'Chương 1: Cơ học',
    notebookId: physicsNotebook.id,
    order: 1,
    tags: [],
    isDemo: true,
  })

  // === Pages ===
  await pageRepo.create({
    title: 'Quy tắc tính đạo hàm',
    content: `<h1>Quy tắc tính đạo hàm</h1>
<h2>1. Đạo hàm hàm cơ bản</h2>
<ul>
  <li><strong>(x<sup>n</sup>)' = n·x<sup>n-1</sup></strong></li>
  <li><strong>(sin x)' = cos x</strong></li>
  <li><strong>(cos x)' = -sin x</strong></li>
  <li><strong>(e<sup>x</sup>)' = e<sup>x</sup></strong></li>
  <li><strong>(ln x)' = 1/x</strong></li>
</ul>
<h2>2. Quy tắc tổng hợp</h2>
<ul>
  <li>(u + v)' = u' + v'</li>
  <li>(u · v)' = u'v + uv'</li>
  <li>(u/v)' = (u'v - uv') / v²</li>
  <li>Hàm hợp: [f(g(x))]' = f'(g(x)) · g'(x)</li>
</ul>
<blockquote><p>📌 Liên kết: [[Tích phân]] ← Đạo hàm và tích phân là hai phép toán ngược nhau</p></blockquote>`,
    sectionId: chapter1.id,
    notebookId: mathNotebook.id,
    order: 1,
    wordCount: 80,
    tags: ['đạo hàm', 'công thức'],
    isDemo: true,
    subjectId: mathSubject.id,
  })

  await pageRepo.create({
    title: 'Các định lý về đạo hàm',
    content: `<h1>Các định lý về đạo hàm</h1>
<h2>Định lý Rolle</h2>
<p>Nếu f liên tục trên [a, b], khả vi trên (a, b) và f(a) = f(b), thì tồn tại c ∈ (a, b) sao cho f'(c) = 0</p>
<h2>Định lý Lagrange (Giá trị trung bình)</h2>
<p>Nếu f liên tục trên [a, b] và khả vi trên (a, b), tồn tại c ∈ (a, b) sao cho:</p>
<p><strong>f'(c) = [f(b) - f(a)] / (b - a)</strong></p>`,
    sectionId: chapter1.id,
    notebookId: mathNotebook.id,
    order: 2,
    wordCount: 60,
    tags: ['định lý', 'đạo hàm'],
    isDemo: true,
    subjectId: mathSubject.id,
  })

  await pageRepo.create({
    title: 'Định luật Newton',
    content: `<h1>Ba định luật Newton</h1>
<h2>Định luật 1: Quán tính</h2>
<p>Mọi vật sẽ đứng yên hoặc chuyển động thẳng đều nếu không có lực tác dụng.</p>
<h2>Định luật 2: F = ma</h2>
<p><strong>F = m × a</strong></p>
<ul>
  <li>F: lực (N)</li>
  <li>m: khối lượng (kg)</li>
  <li>a: gia tốc (m/s²)</li>
</ul>
<h2>Định luật 3: Phản lực</h2>
<p>Lực và phản lực bằng nhau về độ lớn, ngược chiều.</p>`,
    sectionId: physSection.id,
    notebookId: physicsNotebook.id,
    order: 1,
    wordCount: 70,
    tags: ['newton', 'lực'],
    isDemo: true,
    subjectId: physicsSubject.id,
  })

  // === Schedules ===
  const demoSchedules = [
    {
      className: 'Toán Kỹ Thuật',
      classCode: 'MATH301',
      teacher: 'TS. Nguyễn Văn A',
      room: 'B101',
      color: '#6366f1',
      dayOfWeek: 1 as const, // Thứ 2
      startTime: '07:30',
      endTime: '09:30',
      weeks: [],
      notes: 'Mang theo máy tính',
      tags: ['toán'],
      isDemo: true,
      subjectId: mathSubject.id,
    },
    {
      className: 'Vật Lý Đại Cương',
      classCode: 'PHYS201',
      teacher: 'PGS. Trần Thị B',
      room: 'C205',
      color: '#10b981',
      dayOfWeek: 3 as const, // Thứ 4
      startTime: '09:45',
      endTime: '11:45',
      weeks: [],
      notes: 'Mang theo thước kẻ',
      tags: ['vật lý'],
      isDemo: true,
      subjectId: physicsSubject.id,
    },
    {
      className: 'Điện Tử Cơ Bản',
      classCode: 'ELEC101',
      teacher: 'ThS. Lê Văn C',
      room: 'Lab-A',
      color: '#f59e0b',
      dayOfWeek: 5 as const, // Thứ 6
      startTime: '13:00',
      endTime: '15:00',
      weeks: [],
      notes: 'Thực hành tại phòng lab',
      tags: ['điện tử'],
      isDemo: true,
      subjectId: electronicsSubject.id,
    },
    {
      className: 'Toán Kỹ Thuật',
      classCode: 'MATH301',
      teacher: 'TS. Nguyễn Văn A',
      room: 'B102',
      color: '#6366f1',
      dayOfWeek: 4 as const, // Thứ 5
      startTime: '15:15',
      endTime: '17:15',
      weeks: [],
      notes: 'Bài tập lớn',
      tags: ['toán'],
      isDemo: true,
      subjectId: mathSubject.id,
    },
  ]

  for (const schedule of demoSchedules) {
    await scheduleRepo.create(schedule)
  }

  // === M3: MindMap Mẫu ===
  const rootNodeId = 'mm-node-root'
  const branch1Id = 'mm-node-b1'
  const branch2Id = 'mm-node-b2'
  const branch3Id = 'mm-node-b3'
  const sub11Id = 'mm-node-s11'
  const sub12Id = 'mm-node-s12'
  const sub21Id = 'mm-node-s21'
  const sub31Id = 'mm-node-s31'

  await mindmapRepo.create({
    name: 'Giải Tích: Đạo Hàm & Khảo Sát Hàm Số',
    subjectId: mathSubject.id,
    tags: ['toán', 'giải tích', 'đạo hàm'],
    isDemo: true,
    viewport: { x: 0, y: 0, zoom: 0.9 },
    nodes: [
      {
        id: rootNodeId,
        label: 'Đạo Hàm f\'(x)',
        color: '#6366f1',
        formulaLatex: "f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x)-f(x)}{\\Delta x}",
        notes: 'Khái niệm nền tảng của giải tích toán học',
        x: 0,
        y: 200,
      },
      {
        id: branch1Id,
        label: 'Quy Tắc Đạo Hàm',
        color: '#3b82f6',
        parentId: rootNodeId,
        notes: 'Các công thức tính đạo hàm cơ bản',
        x: 280,
        y: 80,
      },
      {
        id: sub11Id,
        label: 'Hàm Hợp & Tích Thương',
        color: '#3b82f6',
        parentId: branch1Id,
        formulaLatex: "(u \\cdot v)' = u'v + uv'",
        x: 560,
        y: 40,
      },
      {
        id: sub12Id,
        label: 'Bảng Đạo Hàm Cơ Bản',
        color: '#3b82f6',
        parentId: branch1Id,
        formulaLatex: "(x^n)' = n x^{n-1}",
        x: 560,
        y: 120,
      },
      {
        id: branch2Id,
        label: 'Ý Nghĩa Hình Học & Vật Lý',
        color: '#10b981',
        parentId: rootNodeId,
        notes: 'Tiếp tuyến và vận tốc chuyển động',
        x: 280,
        y: 200,
      },
      {
        id: sub21Id,
        label: 'Hệ Số Góc Tiếp Tuyến',
        color: '#10b981',
        parentId: branch2Id,
        formulaLatex: "k = f'(x_0)",
        notes: 'Phương trình tiếp tuyến: y = f\'(x0)(x - x0) + y0',
        x: 560,
        y: 200,
      },
      {
        id: branch3Id,
        label: 'Ứng Dụng Khảo Sát Cực Trị',
        color: '#f59e0b',
        parentId: rootNodeId,
        notes: 'Tìm cực đại, cực tiểu và điểm uốn',
        checkItems: [
          { id: 'c1', text: 'Ôn định lý Fermat về điểm dừng', checked: true },
          { id: 'c2', text: 'Xét dấu đạo hàm cấp 2 f\'\'(x)', checked: false },
          { id: 'c3', text: 'Vẽ bảng biến thiên hoàn chỉnh', checked: false },
        ],
        x: 280,
        y: 330,
      },
      {
        id: sub31Id,
        label: 'Định Lý Giá Trị Trung Bình',
        color: '#f59e0b',
        parentId: branch3Id,
        notes: 'Định lý Rolle & Lagrange',
        x: 560,
        y: 330,
      },
    ],
    edges: [
      { id: 'e-r-b1', source: rootNodeId, target: branch1Id },
      { id: 'e-r-b2', source: rootNodeId, target: branch2Id },
      { id: 'e-r-b3', source: rootNodeId, target: branch3Id },
      { id: 'e-b1-s11', source: branch1Id, target: sub11Id },
      { id: 'e-b1-s12', source: branch1Id, target: sub12Id },
      { id: 'e-b2-s21', source: branch2Id, target: sub21Id },
      { id: 'e-b3-s31', source: branch3Id, target: sub31Id },
    ],
  })

  // === M6: Knowledge Graph Mẫu (Toán & Kỹ thuật điện tử) ===
  const knLimit = await knowledgeNodeRepo.create({
    title: 'Giới Hạn Hàm Số (Limits)',
    description: 'Nền tảng của giải tích: xác định hành vi của hàm khi biến tiến dần tới một giá trị.',
    formulaLatex: '\\lim_{x \\to x_0} f(x) = L',
    examples: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
    references: 'Giáo trình Giải tích 1 - ĐHBK',
    difficulty: 1,
    tags: ['giải tích', 'toán'],
    source: 'Toán cao cấp A1',
    verified: true,
    x: 100,
    y: 100,
    isDemo: true,
    subjectId: mathSubject.id,
  })

  const knDerivative = await knowledgeNodeRepo.create({
    title: 'Đạo Hàm (Derivative)',
    description: 'Tốc độ biến thiên tức thời của một hàm số đối với một biến số.',
    formulaLatex: "f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x)-f(x)}{\\Delta x}",
    examples: 'Vận tốc là đạo hàm của quãng đường theo thời gian: v(t) = s\'(t)',
    references: 'James Stewart - Calculus: Early Transcendentals',
    difficulty: 2,
    tags: ['giải tích', 'đạo hàm', 'toán'],
    source: 'Stewart Calculus',
    verified: true,
    x: 400,
    y: 100,
    isDemo: true,
    subjectId: mathSubject.id,
  })

  const knIntegral = await knowledgeNodeRepo.create({
    title: 'Tích Phân Riemann (Definite Integral)',
    description: 'Phép toán ngược của đạo hàm, tính diện tích dưới đường cong và giá trị tích lũy.',
    formulaLatex: '\\int_a^b f(x)\\,dx = F(b) - F(a)',
    examples: '\\int_0^1 x^2\\,dx = \\frac{1}{3}',
    references: 'Định lý cơ bản của Giải tích (Newton-Leibniz)',
    difficulty: 3,
    tags: ['giải tích', 'tích phân', 'toán'],
    source: 'Toán cao cấp A1',
    verified: true,
    x: 400,
    y: 300,
    isDemo: true,
    subjectId: mathSubject.id,
  })

  const knDiffEq = await knowledgeNodeRepo.create({
    title: 'Phương Trình Vi Phân Tuyến Tính Cấp 1',
    description: 'Phương trình chứa đạo hàm bậc nhất của hàm chưa biết, ứng dụng mô hình hóa hệ thống động lực.',
    formulaLatex: "\\frac{dy}{dx} + P(x)y = Q(x)",
    examples: "y' + 2y = e^x \\implies y = Ce^{-2x} + \\frac{1}{3}e^x",
    references: 'Boyce & DiPrima - Elementary Differential Equations',
    difficulty: 4,
    tags: ['phương trình vi phân', 'toán', 'mô hình hóa'],
    source: 'Vi phân & Tích phân ứng dụng',
    verified: true,
    x: 750,
    y: 180,
    isDemo: true,
    subjectId: mathSubject.id,
  })

  const knLaplace = await knowledgeNodeRepo.create({
    title: 'Biến Đổi Laplace (Laplace Transform)',
    description: 'Biến đổi tích phân chuyển phương trình vi phân miền thời gian sang miền tần số phức s.',
    formulaLatex: '\\mathcal{L}\\{f(t)\\} = F(s) = \\int_0^\\infty e^{-st} f(t)\\,dt',
    examples: '\\mathcal{L}\\{e^{at}\\} = \\frac{1}{s-a}',
    references: 'Tín hiệu & Hệ thống, Lý thuyết điều khiển tự động',
    difficulty: 4,
    tags: ['laplace', 'tín hiệu', 'toán'],
    source: 'Kỹ thuật điều khiển hiện đại',
    verified: true,
    x: 1050,
    y: 180,
    isDemo: true,
    subjectId: mathSubject.id,
  })

  const knOhm = await knowledgeNodeRepo.create({
    title: 'Định Luật Ohm (Ohm\'s Law)',
    description: 'Mối liên hệ tuyến tính giữa hiệu điện thế, cường độ dòng điện và điện trở thuần.',
    formulaLatex: 'I = \\frac{U}{R}',
    examples: 'U = 12V, R = 1k\\Omega \\implies I = 12mA',
    references: 'Giáo trình Cơ sở Mạch điện',
    difficulty: 1,
    tags: ['mạch điện', 'điện tử', 'định luật'],
    source: 'Cơ sở Kỹ thuật Điện',
    verified: true,
    x: 400,
    y: 480,
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  const knKirchhoff = await knowledgeNodeRepo.create({
    title: 'Định Luật Kirchhoff (KCL & KVL)',
    description: 'Bảo toàn điện tích tại nút (KCL) và bảo toàn năng lượng trong vòng kín (KVL).',
    formulaLatex: '\\sum I_{in} = \\sum I_{out},\\quad \\sum V_{loop} = 0',
    examples: 'Tổng dòng điện vào một nút mạch bằng tổng dòng điện rời khỏi nút đó.',
    references: 'Alexander & Sadiku - Fundamentals of Electric Circuits',
    difficulty: 2,
    tags: ['mạch điện', 'điện tử', 'kcl', 'kvl'],
    source: 'Sadiku Fundamentals of Electric Circuits',
    verified: true,
    x: 750,
    y: 480,
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  const knRCTransient = await knowledgeNodeRepo.create({
    title: 'Quá Trình Quá Độ Mạch RC (RC Transient)',
    description: 'Đáp ứng nạp và xả của tụ điện theo thời gian, tuân theo phương trình vi phân cấp 1.',
    formulaLatex: 'v_C(t) = V_{in}\\left(1 - e^{-\\frac{t}{RC}}\\right)',
    examples: 'Hằng số thời gian \\tau = RC (thời gian nạp đạt ~63.2% điện áp cực đại).',
    references: 'Mạch điện & Điện tử Tương tự',
    difficulty: 3,
    tags: ['mạch điện', 'quá độ', 'tụ điện', 'điện tử'],
    source: 'Mạch điện 1 - ĐHBK',
    verified: true,
    x: 1050,
    y: 480,
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  // Knowledge Edges (5 loại quan hệ chuẩn xác)
  // Prerequisite
  await knowledgeEdgeRepo.create({
    fromNodeId: knLimit.id,
    toNodeId: knDerivative.id,
    kind: 'Prerequisite',
    label: 'Cần học trước',
    isDemo: true,
  })

  await knowledgeEdgeRepo.create({
    fromNodeId: knDerivative.id,
    toNodeId: knDiffEq.id,
    kind: 'Prerequisite',
    label: 'Cần học trước',
    isDemo: true,
  })

  await knowledgeEdgeRepo.create({
    fromNodeId: knIntegral.id,
    toNodeId: knDiffEq.id,
    kind: 'Prerequisite',
    label: 'Cần học trước',
    isDemo: true,
  })

  await knowledgeEdgeRepo.create({
    fromNodeId: knDiffEq.id,
    toNodeId: knLaplace.id,
    kind: 'Prerequisite',
    label: 'Cần học trước',
    isDemo: true,
  })

  await knowledgeEdgeRepo.create({
    fromNodeId: knOhm.id,
    toNodeId: knKirchhoff.id,
    kind: 'Prerequisite',
    label: 'Cần học trước',
    isDemo: true,
  })

  await knowledgeEdgeRepo.create({
    fromNodeId: knKirchhoff.id,
    toNodeId: knRCTransient.id,
    kind: 'Prerequisite',
    label: 'Cần học trước',
    isDemo: true,
  })

  // Related
  await knowledgeEdgeRepo.create({
    fromNodeId: knDerivative.id,
    toNodeId: knIntegral.id,
    kind: 'Related',
    label: 'Phép toán ngược',
    isDemo: true,
  })

  // AppliedTo
  await knowledgeEdgeRepo.create({
    fromNodeId: knDiffEq.id,
    toNodeId: knRCTransient.id,
    kind: 'AppliedTo',
    label: 'Mô hình hóa quá độ RC',
    isDemo: true,
  })

  // === M4: Ngân hàng câu hỏi mẫu (Kỹ thuật chuẩn xác) ===
  const existingQuestions = await questionRepo.getAll()
  const mathQuestions = existingQuestions.filter(q => q.subjectId === mathSubject.id)
  const physQuestions = existingQuestions.filter(q => q.subjectId === physicsSubject.id)
  const elecQuestions = existingQuestions.filter(q => q.subjectId === electronicsSubject.id)

  if (mathQuestions.length === 0) {
    // 1. Toán Kỹ Thuật
    await questionRepo.create({
      subjectId: mathSubject.id,
      topicId: mathTopic1.id,
      type: 'single',
      prompt: "Đạo hàm cấp 1 của hàm số $f(x) = x^2 e^{3x}$ tại $x = 0$ là:",
      options: [
        { id: 'opt-a', text: '0' },
        { id: 'opt-b', text: '1' },
        { id: 'opt-c', text: '3' },
        { id: 'opt-d', text: '6' },
      ],
      correctAnswer: 'opt-a',
      explanation: "Áp dụng quy tắc đạo hàm tích: $(u \\cdot v)' = u'v + uv'$. Với $u = x^2 \\implies u' = 2x$ và $v = e^{3x} \\implies v' = 3e^{3x}$. Ta có $f'(x) = 2x e^{3x} + 3x^2 e^{3x}$. Thay $x=0 \\implies f'(0) = 0$.",
      difficulty: 2,
      year: 2023,
      source: 'Đề thi Giải tích 1 - ĐHBK',
      tags: ['đạo hàm', 'giải tích'],
      isDemo: true,
    })

    await questionRepo.create({
      subjectId: mathSubject.id,
      topicId: mathTopic2.id,
      type: 'single',
      prompt: "Tính tích phân xác định $I = \\int_0^1 (2x + 1) e^x dx$:",
      options: [
        { id: 'opt-a', text: 'e' },
        { id: 'opt-b', text: '2e - 1' },
        { id: 'opt-c', text: 'e + 1' },
        { id: 'opt-d', text: '2e + 1' },
      ],
      correctAnswer: 'opt-c',
      explanation: "Đặt $u = 2x + 1 \\implies du = 2dx$; $dv = e^x dx \\implies v = e^x$. Áp dụng công thức tích phân từng phần: $I = [(2x+1)e^x]_0^1 - 2\\int_0^1 e^x dx = 3e - 1 - 2(e - 1) = e + 1$.",
      difficulty: 3,
      year: 2022,
      source: 'Toán cao cấp A1',
      tags: ['tích phân', 'từng phần'],
      isDemo: true,
    })

    await questionRepo.create({
      subjectId: mathSubject.id,
      topicId: mathTopic1.id,
      type: 'single',
      prompt: "Giới hạn $\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$ có giá trị bằng:",
      options: [
        { id: 'opt-a', text: '0' },
        { id: 'opt-b', text: '1' },
        { id: 'opt-c', text: '3' },
        { id: 'opt-d', text: 'Vô cùng' },
      ],
      correctAnswer: 'opt-c',
      explanation: "Áp dụng giới hạn cơ bản: $\\lim_{u \\to 0} \\frac{\\sin(u)}{u} = 1$. Ta có $\\frac{\\sin(3x)}{x} = 3 \\cdot \\frac{\\sin(3x)}{3x}$. Khi $x \\to 0$, $3x \\to 0 \\implies$ Giới hạn bằng $3 \\cdot 1 = 3$.",
      difficulty: 1,
      year: 2023,
      source: 'Giải tích 1',
      tags: ['giới hạn', 'lượng giác'],
      isDemo: true,
    })
  }

  if (physQuestions.length === 0) {
    // 2. Vật Lý Đại Cương
    await questionRepo.create({
      subjectId: physicsSubject.id,
      topicId: physTopic1.id,
      type: 'single',
      prompt: "Một vật có khối lượng $m = 2\\text{ kg}$ chịu tác dụng của lực không đổi $F = 10\\text{ N}$. Gia tốc của vật là:",
      options: [
        { id: 'opt-a', text: '2 m/s²' },
        { id: 'opt-b', text: '5 m/s²' },
        { id: 'opt-c', text: '10 m/s²' },
        { id: 'opt-d', text: '20 m/s²' },
      ],
      correctAnswer: 'opt-b',
      explanation: "Theo định luật II Newton: $F = m \\cdot a \\implies a = \\frac{F}{m} = \\frac{10}{2} = 5\\text{ m/s}^2$.",
      difficulty: 1,
      year: 2023,
      source: 'Vật lý đại cương 1',
      tags: ['newton', 'cơ học', 'lực'],
      isDemo: true,
    })

    await questionRepo.create({
      subjectId: physicsSubject.id,
      topicId: physTopic2.id,
      type: 'single',
      prompt: "Con lắc lò xo có độ cứng $k = 100\\text{ N/m}$, khối lượng vật nặng $m = 0.25\\text{ kg}$. Tần số góc dao động riêng $\\omega$ là:",
      options: [
        { id: 'opt-a', text: '10 rad/s' },
        { id: 'opt-b', text: '20 rad/s' },
        { id: 'opt-c', text: '25 rad/s' },
        { id: 'opt-d', text: '40 rad/s' },
      ],
      correctAnswer: 'opt-b',
      explanation: "Tần số góc của con lắc lò xo: $\\omega = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{100}{0.25}} = \\sqrt{400} = 20\\text{ rad/s}$.",
      difficulty: 2,
      year: 2024,
      source: 'Vật lý đại cương 1',
      tags: ['dao động', 'con lắc lò xo'],
      isDemo: true,
    })
  }

  if (elecQuestions.length === 0) {
    // 3. Điện Tử Cơ Bản
    await questionRepo.create({
      subjectId: electronicsSubject.id,
      topicId: elecTopic1.id,
      type: 'single',
      prompt: "Cho mạch phân áp gồm nguồn $V_s = 12\\text{V}$ và hai điện trở nối tiếp $R_1 = 4\\text{k}\\Omega$, $R_2 = 8\\text{k}\\Omega$. Điện áp rơi trên điện trở $R_2$ là:",
      options: [
        { id: 'opt-a', text: '4V' },
        { id: 'opt-b', text: '6V' },
        { id: 'opt-c', text: '8V' },
        { id: 'opt-d', text: '10V' },
      ],
      correctAnswer: 'opt-c',
      explanation: "Theo công thức phân áp: $V_{R2} = V_s \\cdot \\frac{R_2}{R_1 + R_2} = 12 \\cdot \\frac{8}{4 + 8} = 12 \\cdot \\frac{8}{12} = 8\\text{V}$.",
      difficulty: 2,
      year: 2023,
      source: 'Cơ sở Mạch điện',
      tags: ['mạch điện', 'phân áp', 'ohm'],
      isDemo: true,
    })

    await questionRepo.create({
      subjectId: electronicsSubject.id,
      topicId: elecTopic2.id,
      type: 'single',
      prompt: "Mạch RC nối tiếp gồm $R = 10\\text{k}\\Omega$ và $C = 100\\mu\\text{F}$. Hằng số thời gian $\\tau$ của mạch là:",
      options: [
        { id: 'opt-a', text: '0.1s' },
        { id: 'opt-b', text: '1.0s' },
        { id: 'opt-c', text: '10s' },
        { id: 'opt-d', text: '100s' },
      ],
      correctAnswer: 'opt-b',
      explanation: "Hằng số thời gian $\\tau = R \\cdot C = 10 \\cdot 10^3\\,\\Omega \\times 100 \\cdot 10^{-6}\\,\\text{F} = 1.0\\,\\text{s}$.",
      difficulty: 2,
      year: 2024,
      source: 'Mạch điện tử tương tự',
      tags: ['quá độ', 'rc', 'hằng số thời gian'],
      isDemo: true,
    })

    await questionRepo.create({
      subjectId: electronicsSubject.id,
      topicId: elecTopic2.id,
      type: 'single',
      prompt: "Trở kháng phức của tụ điện có điện dung $C$ ở tần số góc $\\omega$ được biểu diễn là:",
      options: [
        { id: 'opt-a', text: 'Z_C = j\\omega C' },
        { id: 'opt-b', text: 'Z_C = \\frac{1}{j\\omega C} = -\\frac{j}{\\omega C}' },
        { id: 'opt-c', text: 'Z_C = \\omega C' },
        { id: 'opt-d', text: 'Z_C = \\frac{R}{j\\omega C}' },
      ],
      correctAnswer: 'opt-b',
      explanation: "Theo lý thuyết mạch xoay chiều tần số cao, trở kháng phức của tụ điện là $Z_C = \\frac{1}{j\\omega C} = -j \\frac{1}{\\omega C}$.",
      difficulty: 3,
      year: 2023,
      source: 'Lý thuyết Mạch 1',
      tags: ['trở kháng', 'tụ điện', 'số phức'],
      isDemo: true,
    })
  }

  // === M5: Thư viện công thức kỹ thuật (Tính toán tương tác & từng bước) ===
  await formulaRepo.create({
    name: "Định Luật Ohm (Ohm's Law)",
    category: 'electronics',
    latex: "I = \\frac{U}{R}",
    description: "Cường độ dòng điện chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với điện trở.",
    expression: "U / R",
    resultSymbol: "I",
    resultUnit: "A (Ampe)",
    variables: [
      { symbol: "U", name: "Hiệu điện thế", unit: "V (Volt)", defaultValue: 12 },
      { symbol: "R", name: "Điện trở", unit: "Ω (Ohm)", defaultValue: 100 },
    ],
    stepsExplanation: [
      "Bước 1: Xác định hiệu điện thế hai đầu điện trở U (V) và giá trị điện trở thuần R (Ω).",
      "Bước 2: Áp dụng định luật Ohm: I = U / R.",
      "Bước 3: Thay số và rút ra cường độ dòng điện chạy qua mạch theo đơn vị Ampe.",
    ],
    tags: ['ohm', 'điện trở', 'dòng điện'],
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  await formulaRepo.create({
    name: "Cầu Phân Áp (Voltage Divider)",
    category: 'electronics',
    latex: "V_{out} = V_{in} \\cdot \\frac{R_2}{R_1 + R_2}",
    description: "Tính điện áp đầu ra trên điện trở R2 khi mắc nối tiếp R1 và R2 với nguồn Vin.",
    expression: "Vin * (R2 / (R1 + R2))",
    resultSymbol: "Vout",
    resultUnit: "V (Volt)",
    variables: [
      { symbol: "Vin", name: "Điện áp nguồn đầu vào", unit: "V", defaultValue: 12 },
      { symbol: "R1", name: "Điện trở nhánh trên R1", unit: "Ω", defaultValue: 1000 },
      { symbol: "R2", name: "Điện trở nhánh dưới R2", unit: "Ω", defaultValue: 2000 },
    ],
    stepsExplanation: [
      "Bước 1: Xác định tổng trở tương đương của mạch nối tiếp: R_td = R1 + R2.",
      "Bước 2: Dòng điện chung chạy qua mạch: I = Vin / (R1 + R2).",
      "Bước 3: Điện áp lấy ra trên R2: Vout = I * R2 = Vin * R2 / (R1 + R2).",
    ],
    tags: ['phân áp', 'mạch điện'],
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  await formulaRepo.create({
    name: "Hằng Số Thời Gian Mạch RC (RC Time Constant)",
    category: 'electronics',
    latex: "\\tau = R \\cdot C",
    description: "Thời gian để điện áp trên tụ nạp đạt khoảng 63.2% giá trị cực đại.",
    expression: "R * C",
    resultSymbol: "tau",
    resultUnit: "s (Giây)",
    variables: [
      { symbol: "R", name: "Điện trở nạp", unit: "Ω", defaultValue: 10000 },
      { symbol: "C", name: "Điện dung tụ điện", unit: "F (Farad)", defaultValue: 0.0001 },
    ],
    stepsExplanation: [
      "Bước 1: Quy đổi điện dung C về đơn vị chuẩn Farad (F) và điện trở R về Ohm (Ω).",
      "Bước 2: Tính tích số hằng số thời gian: tau = R * C.",
      "Bước 3: Sau khoảng thời gian 5 * tau, quá trình nạp/xả tụ được xem như hoàn tất (~99.3%).",
    ],
    tags: ['rc', 'quá độ', 'hằng số thời gian'],
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  await formulaRepo.create({
    name: "Tần Số Cộng Hưởng Mạch LC (Resonance Frequency)",
    category: 'electronics',
    latex: "f_0 = \\frac{1}{2\\pi\\sqrt{L \\cdot C}}",
    description: "Tần số tại đó cảm kháng bằng dung kháng trong mạch dao động LC.",
    expression: "1 / (2 * pi * sqrt(L * C))",
    resultSymbol: "f0",
    resultUnit: "Hz (Hertz)",
    variables: [
      { symbol: "L", name: "Độ tự cảm cuộn dây", unit: "H (Henry)", defaultValue: 0.001 },
      { symbol: "C", name: "Điện dung tụ điện", unit: "F (Farad)", defaultValue: 0.000001 },
    ],
    stepsExplanation: [
      "Bước 1: Điều kiện cộng hưởng: Z_L = Z_C => omega * L = 1 / (omega * C).",
      "Bước 2: Tần số góc cộng hưởng: omega_0 = 1 / sqrt(L * C).",
      "Bước 3: Tần số f_0 = omega_0 / (2 * pi) = 1 / (2 * pi * sqrt(L * C)).",
    ],
    tags: ['cộng hưởng', 'lc', 'tần số'],
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  await formulaRepo.create({
    name: "Công Suất Mạch Điện Xoay Chiều (Active Power)",
    category: 'physics',
    latex: "P = U \\cdot I \\cdot \\cos(\\varphi)",
    description: "Công suất tác dụng tiêu thụ trên tải xoay chiều hình sin 1 pha.",
    expression: "U * I * cos(phi)",
    resultSymbol: "P",
    resultUnit: "W (Watt)",
    variables: [
      { symbol: "U", name: "Điện áp hiệu dụng", unit: "V", defaultValue: 220 },
      { symbol: "I", name: "Dòng điện hiệu dụng", unit: "A", defaultValue: 5 },
      { symbol: "phi", name: "Góc lệch pha (Radian)", unit: "rad", defaultValue: 0.52 },
    ],
    stepsExplanation: [
      "Bước 1: Xác định điện áp hiệu dụng U và dòng điện hiệu dụng I.",
      "Bước 2: Xác định hệ số công suất cos(phi) của tải tiêu thụ.",
      "Bước 3: Tính công suất tác dụng: P = U * I * cos(phi).",
    ],
    tags: ['công suất', 'xoay chiều', 'vật lý'],
    isDemo: true,
    subjectId: electronicsSubject.id,
  })

  await formulaRepo.create({
    name: "Biệt Thức Phương Trình Bậc Hai (Delta)",
    category: 'math',
    latex: "\\Delta = b^2 - 4ac",
    description: "Dùng để biện luận và tìm nghiệm của phương trình bậc 2: ax^2 + bx + c = 0.",
    expression: "b^2 - 4 * a * c",
    resultSymbol: "Delta",
    resultUnit: "",
    variables: [
      { symbol: "a", name: "Hệ số bậc 2 (a ≠ 0)", unit: "", defaultValue: 1 },
      { symbol: "b", name: "Hệ số bậc 1", unit: "", defaultValue: -5 },
      { symbol: "c", name: "Hằng số tự do", unit: "", defaultValue: 6 },
    ],
    stepsExplanation: [
      "Bước 1: Tính biệt thức Delta = b^2 - 4ac.",
      "Bước 2: Nếu Delta > 0, phương trình có 2 nghiệm phân biệt: x1,2 = (-b ± sqrt(Delta)) / (2a).",
      "Bước 3: Nếu Delta = 0, nghiệm kép: x = -b / (2a). Nếu Delta < 0, phương trình vô nghiệm thực (có nghiệm phức).",
    ],
    tags: ['phương trình bậc 2', 'đại số', 'toán'],
    isDemo: true,
    subjectId: mathSubject.id,
  })

  // === M7: Cơ sở dữ liệu linh kiện & chân IC điện tử (Chuẩn xác 100%) ===
  await componentRepo.create({
    name: 'NE555',
    code: 'NE555P',
    category: 'ic',
    package: 'DIP-8',
    description: 'Vi mạch định thời đa năng kinh điển (Precision Timer), hoạt động ở 2 chế độ Astable (dao động xung liên tục) và Monostable (định thời 1 xung).',
    operatingVoltage: { min: 4.5, typ: 5.0, max: 16.0, unit: 'V' },
    maxCurrent: '200 mA (dòng ngõ ra)',
    frequency: 'Lên đến 500 kHz',
    temperatureRange: '0°C đến 70°C',
    verified: true,
    manufacturer: 'Texas Instruments / STMicroelectronics',
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/ne555.pdf',
    tags: ['ic', 'timer', 'dao động', 'ne555', '555', 'dip-8'],
    isDemo: true,
    subjectId: electronicsSubject.id,
    pins: [
      { number: 1, name: 'GND', type: 'ground', description: 'Mass nối đất (0V)' },
      { number: 2, name: 'TRIG', type: 'control', description: 'Kích hoạt (Trigger). Tích cực mức thấp (< 1/3 VCC), kích khởi chu kỳ xung ngõ ra.' },
      { number: 3, name: 'OUT', type: 'io', description: 'Đầu ra (Output). Dòng tải cấp/hút lên đến 200mA, đảo với trạng thái chốt trong.' },
      { number: 4, name: 'RESET', type: 'control', description: 'Tái lập trạng thái (Reset). Tích cực mức thấp (< 0.7V), buộc ngõ ra về mức thấp.' },
      { number: 5, name: 'CTRL', type: 'analog', description: 'Điện áp điều khiển (Control Voltage). Mặc định 2/3 VCC, nối tụ 10nF xuống GND để lọc nhiễu.' },
      { number: 6, name: 'THRESH', type: 'analog', description: 'Ngưỡng so sánh (Threshold). Tích cực mức cao (> 2/3 VCC), kết thúc chu kỳ xung.' },
      { number: 7, name: 'DISCH', type: 'io', description: 'Xả điện (Discharge). Cực thu hở (open collector), xả tụ điện ngoài chu kỳ nạp.' },
      { number: 8, name: 'VCC', type: 'power', description: 'Nguồn cấp dương (+4.5V đến +16V)' },
    ],
    applicationCircuits: [
      {
        title: 'Mạch dao động đa hài không bền (Astable Multivibrator)',
        description: 'Tạo chuỗi xung vuông liên tục với tần số f = 1.44 / ((R1 + 2*R2) * C1).',
        schematicExplanation: 'Tụ C1 được nạp qua (R1 + R2) từ VCC đến ngưỡng 2/3 VCC (chân 6). Bộ so sánh lật trạng thái, transistor xả (chân 7) dẫn, xả tụ C1 qua R2 về 1/3 VCC (chân 2). Quá trình lặp vô hạn tạo xung vuông tại chân 3.',
        bom: [
          { componentName: 'NE555P Timer IC', quantity: 1, note: 'DIP-8' },
          { componentName: 'Điện trở R1 10kΩ 1/4W', quantity: 1 },
          { componentName: 'Điện trở R2 100kΩ 1/4W', quantity: 1 },
          { componentName: 'Tụ hóa C1 10µF 25V', quantity: 1, note: 'Định thời tần số' },
          { componentName: 'Tụ gốm C2 10nF (103)', quantity: 1, note: 'Lọc chân CTRL số 5' },
          { componentName: 'LED 5mm đỏ', quantity: 1, note: 'Chỉ thị ngõ ra' },
          { componentName: 'Điện trở hạn dòng LED 330Ω', quantity: 1 },
        ],
      },
    ],
  })

  await componentRepo.create({
    name: 'LM358',
    code: 'LM358N',
    category: 'ic',
    package: 'DIP-8',
    description: 'Khuếch đại thuật toán kép (Dual Operational Amplifier) năng lượng thấp, hoạt động được từ nguồn đơn (Single Supply) từ 3V.',
    operatingVoltage: { min: 3.0, typ: 12.0, max: 32.0, unit: 'V' },
    maxCurrent: '40 mA (dòng ngắn mạch ngõ ra)',
    frequency: 'Băng thông khuếch đại hợp nhất 1.0 MHz',
    temperatureRange: '0°C đến 70°C',
    verified: true,
    manufacturer: 'Texas Instruments / ON Semi',
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/lm358.pdf',
    tags: ['ic', 'opamp', 'khuếch đại', 'lm358', 'dip-8'],
    isDemo: true,
    subjectId: electronicsSubject.id,
    pins: [
      { number: 1, name: 'OUT1', type: 'analog', description: 'Ngõ ra của Bộ khuếch đại thuật toán 1' },
      { number: 2, name: 'IN1-', type: 'analog', description: 'Ngõ vào đảo (-) của Op-Amp 1' },
      { number: 3, name: 'IN1+', type: 'analog', description: 'Ngõ vào không đảo (+) của Op-Amp 1' },
      { number: 4, name: 'GND', type: 'ground', description: 'Mass (nguồn đơn) hoặc V- (nguồn đôi)' },
      { number: 5, name: 'IN2+', type: 'analog', description: 'Ngõ vào không đảo (+) của Op-Amp 2' },
      { number: 6, name: 'IN2-', type: 'analog', description: 'Ngõ vào đảo (-) của Op-Amp 2' },
      { number: 7, name: 'OUT2', type: 'analog', description: 'Ngõ ra của Bộ khuếch đại thuật toán 2' },
      { number: 8, name: 'VCC', type: 'power', description: 'Nguồn cấp dương V+ (+3V đến +32V)' },
    ],
    applicationCircuits: [
      {
        title: 'Mạch khuếch đại đảo (Inverting Amplifier)',
        description: 'Khuếch đại tín hiệu điện áp xoay chiều hoặc một chiều với hệ số khuếch đại Gain Av = -Rf / Rin.',
        schematicExplanation: 'Tín hiệu vào Vin qua Rin nối vào chân đảo IN1- (chân 2). Điện trở phản hồi Rf mắc giữa chân OUT1 (chân 1) và IN1-. Chân không đảo IN1+ (chân 3) nối đất GND. Do khái niệm đất ảo, điện áp ra Vout = -(Rf / Rin) * Vin.',
        bom: [
          { componentName: 'LM358N Dual Op-Amp', quantity: 1, note: 'DIP-8' },
          { componentName: 'Điện trở Rin 10kΩ 1%', quantity: 1 },
          { componentName: 'Điện trở Rf 100kΩ 1%', quantity: 1, note: 'Độ lợi Av = -10' },
          { componentName: 'Tụ gốm 100nF (104)', quantity: 1, note: 'Tụ giải mã nguồn chân VCC' },
        ],
      },
    ],
  })

  await componentRepo.create({
    name: '74HC595',
    code: 'SN74HC595N',
    category: 'ic',
    package: 'DIP-16',
    description: 'Thanh ghi dịch 8-bit ngõ vào nối tiếp, ngõ ra song song kèm chốt lưu trữ (8-bit Serial-In Parallel-Out Shift Register with Latches). Mở rộng ngõ ra cho vi điều khiển.',
    operatingVoltage: { min: 2.0, typ: 5.0, max: 6.0, unit: 'V' },
    maxCurrent: '35 mA (tối đa mỗi chân ngõ ra)',
    frequency: '100 MHz (tại 5V VCC)',
    temperatureRange: '-40°C đến 85°C',
    verified: true,
    manufacturer: 'Texas Instruments',
    datasheetUrl: 'https://www.ti.com/lit/ds/symlink/sn74hc595.pdf',
    tags: ['ic', 'logic', 'shift register', '74hc595', 'mở rộng gpio', 'dip-16'],
    isDemo: true,
    subjectId: electronicsSubject.id,
    pins: [
      { number: 1, name: 'QB', type: 'io', description: 'Ngõ ra dữ liệu song song bit 1 (Q1)' },
      { number: 2, name: 'QC', type: 'io', description: 'Ngõ ra dữ liệu song song bit 2 (Q2)' },
      { number: 3, name: 'QD', type: 'io', description: 'Ngõ ra dữ liệu song song bit 3 (Q3)' },
      { number: 4, name: 'QE', type: 'io', description: 'Ngõ ra dữ liệu song song bit 4 (Q4)' },
      { number: 5, name: 'QF', type: 'io', description: 'Ngõ ra dữ liệu song song bit 5 (Q5)' },
      { number: 6, name: 'QG', type: 'io', description: 'Ngõ ra dữ liệu song song bit 6 (Q6)' },
      { number: 7, name: 'QH', type: 'io', description: 'Ngõ ra dữ liệu song song bit 7 (Q7)' },
      { number: 8, name: 'GND', type: 'ground', description: 'Mass nối đất (0V)' },
      { number: 9, name: "QH'", type: 'io', description: 'Ngõ ra dữ liệu nối tiếp (Serial Out) phục vụ ghép tầng IC tiếp theo' },
      { number: 10, name: 'SRCLR#', type: 'control', description: 'Xóa thanh ghi dịch (Shift Register Clear, tích cực mức THẤP)' },
      { number: 11, name: 'SRCLK', type: 'control', description: 'Xung nhịp dịch (Shift Clock / SH_CP, dịch dữ liệu khi có cạnh lên)' },
      { number: 12, name: 'RCLK', type: 'control', description: 'Xung nhịp chốt (Latch Clock / ST_CP, xuất dữ liệu ra ngõ ra khi có cạnh lên)' },
      { number: 13, name: 'OE#', type: 'control', description: 'Cho phép ngõ ra (Output Enable, tích cực mức THẤP)' },
      { number: 14, name: 'SER', type: 'comm', description: 'Dữ liệu nối tiếp vào (Serial Data In / DS)' },
      { number: 15, name: 'QA', type: 'io', description: 'Ngõ ra dữ liệu song song bit 0 (Q0)' },
      { number: 16, name: 'VCC', type: 'power', description: 'Nguồn cấp dương (+2V đến +6V)' },
    ],
  })

  await componentRepo.create({
    name: '2N2222',
    code: 'PN2222A',
    category: 'transistor',
    package: 'TO-92',
    description: 'Transistor lưỡng cực NPN (BJT) tốc độ cao, đa dụng trong mạch đóng cắt công tắc (Switching) và khuếch đại tín hiệu nhỏ (Amplifier).',
    operatingVoltage: { min: 0, typ: 12, max: 40, unit: 'V (Vceo)' },
    maxCurrent: '800 mA (Dòng cực thu Ic tối đa)',
    frequency: '300 MHz (Tần số cắt ft)',
    temperatureRange: '-55°C đến 150°C',
    verified: true,
    manufacturer: 'Central Semiconductor / Fairchild',
    tags: ['transistor', 'bjt', 'npn', '2n2222', 'to-92', 'công tắc'],
    isDemo: true,
    subjectId: electronicsSubject.id,
    pins: [
      { number: 1, name: 'E', type: 'passive', description: 'Emitter (Cực phát) - Nhìn từ mặt phẳng có chữ: chân 1 bên trái' },
      { number: 2, name: 'B', type: 'passive', description: 'Base (Cực nền) - Chân điều khiển dòng trung tâm (chân 2)' },
      { number: 3, name: 'C', type: 'passive', description: 'Collector (Cực thu) - Chân thu dòng bên phải (chân 3)' },
    ],
  })

  await componentRepo.create({
    name: 'ATmega328P',
    code: 'ATMEGA328P-PU',
    category: 'ic',
    package: 'DIP-28',
    description: 'Vi điều khiển 8-bit AVR RISC hiệu năng cao với 32KB bộ nhớ Flash, 2KB SRAM, 1KB EEPROM, tích hợp bộ ADC 10-bit và module UART/SPI/I2C.',
    operatingVoltage: { min: 1.8, typ: 5.0, max: 5.5, unit: 'V' },
    maxCurrent: '40 mA (dòng DC tối đa mỗi chân I/O)',
    frequency: '16 MHz (ở 5V) / 20 MHz tối đa',
    temperatureRange: '-40°C đến 85°C',
    verified: true,
    manufacturer: 'Microchip Technology (Atmel)',
    datasheetUrl: 'https://ww1.microchip.com/downloads/en/DeviceDoc/Atmel-7810-Automotive-Microcontrollers-ATmega328P_Datasheet.pdf',
    tags: ['mcu', 'avr', 'arduino', 'atmega328p', 'dip-28', 'vi điều khiển'],
    isDemo: true,
    subjectId: electronicsSubject.id,
    pins: [
      { number: 1, name: 'PC6 (RESET#)', type: 'control', description: 'Chân Reset vi điều khiển (tích cực mức thấp)' },
      { number: 2, name: 'PD0 (RXD)', type: 'comm', description: 'Nhận dữ liệu UART (Digital Pin 0)' },
      { number: 3, name: 'PD1 (TXD)', type: 'comm', description: 'Truyền dữ liệu UART (Digital Pin 1)' },
      { number: 4, name: 'PD2 (INT0)', type: 'io', description: 'Ngắt ngoài 0 (Digital Pin 2)' },
      { number: 5, name: 'PD3 (INT1/PWM)', type: 'pwm', description: 'Ngắt ngoài 1 / Ngõ ra PWM OC2B (Digital Pin 3)' },
      { number: 6, name: 'PD4 (T0)', type: 'io', description: 'Đầu vào xung Timer 0 (Digital Pin 4)' },
      { number: 7, name: 'VCC', type: 'power', description: 'Nguồn cấp kỹ thuật số (+5V)' },
      { number: 8, name: 'GND', type: 'ground', description: 'Mass nối đất số (0V)' },
      { number: 9, name: 'PB6 (XTAL1)', type: 'control', description: 'Chân thạch anh dao động ngoài 1 (hoặc TOSC1)' },
      { number: 10, name: 'PB7 (XTAL2)', type: 'control', description: 'Chân thạch anh dao động ngoài 2 (hoặc TOSC2)' },
      { number: 11, name: 'PD5 (T1/PWM)', type: 'pwm', description: 'Đầu vào Timer 1 / PWM OC0B (Digital Pin 5)' },
      { number: 12, name: 'PD6 (AIN0/PWM)', type: 'pwm', description: 'Ngõ vào Analog Comp 0 / PWM OC0A (Digital Pin 6)' },
      { number: 13, name: 'PD7 (AIN1)', type: 'io', description: 'Ngõ vào Analog Comp 1 (Digital Pin 7)' },
      { number: 14, name: 'PB0 (ICP1)', type: 'io', description: 'Chân bắt xung Timer 1 (Digital Pin 8)' },
      { number: 15, name: 'PB1 (OC1A/PWM)', type: 'pwm', description: 'PWM Timer 1A (Digital Pin 9)' },
      { number: 16, name: 'PB2 (SS/PWM)', type: 'pwm', description: 'SPI Slave Select / PWM Timer 1B (Digital Pin 10)' },
      { number: 17, name: 'PB3 (MOSI/PWM)', type: 'comm', description: 'SPI Master Out Slave In / PWM OC2A (Digital Pin 11)' },
      { number: 18, name: 'PB4 (MISO)', type: 'comm', description: 'SPI Master In Slave Out (Digital Pin 12)' },
      { number: 19, name: 'PB5 (SCK)', type: 'comm', description: 'SPI Clock (Digital Pin 13 / LED tích hợp)' },
      { number: 20, name: 'AVCC', type: 'power', description: 'Nguồn cấp khối ADC (+5V, nối tụ lọc xuống GND)' },
      { number: 21, name: 'AREF', type: 'analog', description: 'Điện áp tham chiếu tương tự ngoài cho ADC' },
      { number: 22, name: 'GND', type: 'ground', description: 'Mass nối đất tương tự (0V)' },
      { number: 23, name: 'PC0 (ADC0)', type: 'analog', description: 'Ngõ vào tương tự 0 (Analog In A0)' },
      { number: 24, name: 'PC1 (ADC1)', type: 'analog', description: 'Ngõ vào tương tự 1 (Analog In A1)' },
      { number: 25, name: 'PC2 (ADC2)', type: 'analog', description: 'Ngõ vào tương tự 2 (Analog In A2)' },
      { number: 26, name: 'PC3 (ADC3)', type: 'analog', description: 'Ngõ vào tương tự 3 (Analog In A3)' },
      { number: 27, name: 'PC4 (ADC4/SDA)', type: 'comm', description: 'Ngõ vào Analog 4 / Đường truyền dữ liệu I2C SDA (A4)' },
      { number: 28, name: 'PC5 (ADC5/SCL)', type: 'comm', description: 'Ngõ vào Analog 5 / Xung nhịp I2C SCL (A5)' },
    ],
  })
}
