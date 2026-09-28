import {
  subjectRepo,
  topicRepo,
  notebookRepo,
  sectionRepo,
  pageRepo,
  scheduleRepo,
} from './repositories'
import { db } from './database'

// Cờ kiểm tra đã seed chưa (lưu localStorage thay vì IndexedDB để kiểm tra nhanh)
const SEED_KEY = 'study_os_seeded_v1'

/**
 * Nạp dữ liệu mẫu tiếng Việt khi khởi chạy lần đầu
 * Chỉ chạy một lần, được đánh cờ isDemo = true
 */
export async function seedDemoDataIfNeeded(): Promise<void> {
  const alreadySeeded = localStorage.getItem(SEED_KEY)
  if (alreadySeeded) return

  // Kiểm tra nếu đã có dữ liệu thực (không phải lần đầu tiên)
  const existingNotebooks = await db.notebooks.count()
  if (existingNotebooks > 0) {
    localStorage.setItem(SEED_KEY, 'true')
    return
  }

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

}
