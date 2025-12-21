const now = new Date();
const plusDays = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

// helper: random date within last 30 days
const randomCreatedAt = () => {
  const msInDay = 24 * 60 * 60 * 1000;
  const delta = Math.floor(Math.random() * 30 * msInDay);
  return new Date(now.getTime() - delta).toISOString();
};

const randomParticipants = () => Math.floor(Math.random() * 80) + 1; // 1..80

// helper: build ISO date for current month/day with time
const beforeDayTime = (day, hour = 9, minute = 0) => {
  const y = now.getFullYear();
  const m = now.getMonth();
  return new Date(y, m, day, hour, minute, 0, 0).toISOString();
};

// helper: random createdAt before day 20 of current month
const randomCreatedBefore20 = () => {
  const day = Math.floor(Math.random() * 19) + 1; // 1..19
  const hour = Math.floor(Math.random() * 8) + 8; // 8..15
  return beforeDayTime(day, hour, 0);
};

export const sampleEvents = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66a001',
    name: 'Hiến máu nhân đạo',
    description: 'Chương trình hiến máu diễn ra tại nhà văn hóa quận. Mời bạn đăng ký tham gia. Ưu tiên sinh viên và người lao động gần khu vực.',
    location: 'Nhà văn hóa Quận Ba Đình, Hà Nội',
    dateDeadline: plusDays(2),
    startDate: plusDays(3),
    endDate: plusDays(3.25),
    ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b001',
    status: 'APPROVED',
    createdAt: plusDays(1),
    registeredCount: randomParticipants(),
    creatorName: 'Nguyễn Văn An',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66a002',
    name: 'Dọn vệ sinh bờ biển',
    description: 'Cùng chung tay dọn rác, bảo vệ môi trường biển. Vui lòng mang theo mũ, găng tay và nước uống.',
    location: 'Công viên Yên Sở, Hà Nội',
    dateDeadline: plusDays(5),
    startDate: plusDays(6),
    endDate: plusDays(6.5),
    ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b002',
    status: 'APPROVED',
    createdAt: plusDays(3),
    registeredCount: randomParticipants(),
    creatorName: 'Trần Thị Bình',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66a003',
    name: 'Trồng cây gây rừng',
    description: 'Sự kiện trồng cây gây rừng tại khu vực ngoại thành, số lượng tình nguyện viên có hạn.',
    location: 'Vườn quốc gia Ba Vì, Hà Nội',
    dateDeadline: beforeDayTime(10, 12),
    startDate: beforeDayTime(11, 8),
    endDate: beforeDayTime(11, 12),
    ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b003',
    status: 'COMPLETED',
    createdAt: beforeDayTime(8, 14),
    registeredCount: randomParticipants(),
    creatorName: 'Lê Văn Cường',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66a004',
    name: 'Phát cháo từ thiện',
    description: 'Phát cháo sáng cho bệnh nhân tại bệnh viện. Cần hỗ trợ chuẩn bị và phân phát.',
    location: 'Bệnh viện Bạch Mai, Hà Nội',
    dateDeadline: beforeDayTime(5, 10),
    startDate: beforeDayTime(6, 9),
    endDate: beforeDayTime(6, 13),
    ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b004',
    status: 'COMPLETED',
    createdAt: beforeDayTime(3, 16),
    registeredCount: randomParticipants(),
    creatorName: 'Phạm Thị Dung',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66a005',
    name: 'Dạy học cuối tuần',
    description: 'Dạy học miễn phí cho trẻ em khó khăn vào cuối tuần. Ưu tiên sinh viên sư phạm.',
    location: 'Trung tâm Văn hóa Quận Hoàn Kiếm, Hà Nội',
    dateDeadline: beforeDayTime(3, 9),
    startDate: beforeDayTime(4, 8),
    endDate: beforeDayTime(4, 12),
    ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b005',
    status: 'COMPLETED',
    createdAt: beforeDayTime(1, 11),
    registeredCount: randomParticipants(),
    creatorName: 'Hoàng Văn Em',
  },
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66a006',
    name: 'Hỗ trợ tiếp sức mùa thi',
    description: 'Hỗ trợ sĩ tử và phụ huynh tại các điểm thi, điều phối xe và nước uống.',
    location: 'Trường Đại học Bách Khoa Hà Nội (điểm tập trung)',
    dateDeadline: beforeDayTime(15, 9),
    startDate: beforeDayTime(16, 8),
    endDate: beforeDayTime(16, 12),
    ownerId: '3fa85f64-5717-4562-b3fc-2c963f66b006',
    status: 'COMPLETED',
    createdAt: beforeDayTime(13, 10),
    registeredCount: randomParticipants(),
    creatorName: 'Vũ Thị Hồng',
  },
];
