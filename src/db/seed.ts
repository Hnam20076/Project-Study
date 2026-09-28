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
} from './repositories'
import { db } from './database'

// Cờ kiểm tra đã seed chưa (lưu localStorage thay vì IndexedDB để kiểm tra nhanh)
const SEED_KEY = 'study_os_seeded_v2'

/**
 * Nạp dữ liệu mẫu tiếng Việt khi khởi chạy lần đầu
 * Chỉ chạy một lần, được đánh cờ isDemo = true
 */
export async function seedDemoDataIfNeeded(): Promise<void> {
  const alreadySeeded = localStorage.getItem(SEED_KEY)
  if (alreadySeeded) return

  await seedDemoData()
  localStorage.setItem(SEED_KEY, 'true')
}

async function seedDemoData(): Promise<void> {

  // === Subjects ===
  const mathSubject = await subjectRepo.create({
    name: 'Toán Kỹ Thuật',
    code: 'MATH301',
    color: '#6366f1',
    description: 'Giải tích, đại số tuyến tính, xác suất thống kê',
    semester: 'HK1-2024',
    tags: ['toán', 'kỹ thuật'],
    isDemo: true,
  })

  const physicsSubject = await subjectRepo.create({
    name: 'Vật Lý Đại Cương',
    code: 'PHYS201',
    color: '#10b981',
    description: 'Cơ học, nhiệt học, điện từ, quang học',
    semester: 'HK1-2024',
    tags: ['vật lý', 'đại cương'],
    isDemo: true,
  })

  const electronicsSubject = await subjectRepo.create({
    name: 'Điện Tử Cơ Bản',
    code: 'ELEC101',
    color: '#f59e0b',
    description: 'Linh kiện điện tử, mạch điện cơ bản',
    semester: 'HK1-2024',
    tags: ['điện tử', 'mạch'],
    isDemo: true,
  })

  // === Topics ===
  await topicRepo.create({
    name: 'Đạo hàm',
    subjectId: mathSubject.id,
    description: 'Khái niệm, quy tắc tính đạo hàm',
    order: 1,
    tags: ['giải tích'],
    isDemo: true,
  })

  await topicRepo.create({
    name: 'Tích phân',
    subjectId: mathSubject.id,
    description: 'Tích phân xác định và bất định',
    order: 2,
    tags: ['giải tích'],
    isDemo: true,
  })

  await topicRepo.create({
    name: 'Định luật Ôm',
    subjectId: electronicsSubject.id,
    description: 'U = I × R',
    order: 1,
    tags: ['mạch', 'điện'],
    isDemo: true,
  })

  void physicsSubject // đã tạo, dùng sau

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
}
