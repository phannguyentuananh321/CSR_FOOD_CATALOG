import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const PREFIXES = [
  { prefix: 'Phở', cat: 'Món nước' },
  { prefix: 'Bún', cat: 'Món nước' },
  { prefix: 'Hủ tiếu', cat: 'Món nước' },
  { prefix: 'Miến', cat: 'Món nước' },
  { prefix: 'Mì', cat: 'Món nước' },
  { prefix: 'Bánh canh', cat: 'Món nước' },
  { prefix: 'Cơm', cat: 'Món chính' },
  { prefix: 'Cơm chiên', cat: 'Món chính' },
  { prefix: 'Cơm tấm', cat: 'Món chính' },
  { prefix: 'Bò', cat: 'Món chính' },
  { prefix: 'Gà', cat: 'Món chính' },
  { prefix: 'Heo', cat: 'Món chính' },
  { prefix: 'Vịt', cat: 'Món chính' },
  { prefix: 'Cá', cat: 'Món chính' },
  { prefix: 'Hải sản', cat: 'Hải sản' },
  { prefix: 'Tôm', cat: 'Hải sản' },
  { prefix: 'Mực', cat: 'Hải sản' },
  { prefix: 'Cua', cat: 'Hải sản' },
  { prefix: 'Nghêu', cat: 'Hải sản' },
  { prefix: 'Ốc', cat: 'Hải sản' },
  { prefix: 'Lẩu', cat: 'Món chính' },
  { prefix: 'Gỏi', cat: 'Món khai vị' },
  { prefix: 'Salad', cat: 'Món khai vị' },
  { prefix: 'Nem', cat: 'Món khai vị' },
  { prefix: 'Chả giò', cat: 'Món khai vị' },
  { prefix: 'Bánh', cat: 'Món khai vị' },
  { prefix: 'Nấm', cat: 'Món chay' },
  { prefix: 'Đậu hũ', cat: 'Món chay' },
  { prefix: 'Canh', cat: 'Món chính' },
  { prefix: 'Chè', cat: 'Món tráng miệng' },
];

const MAIN_ITEMS = [
  'bò tái lăn',
  'bò sốt vang',
  'bò nướng lá lốt',
  'bò lúc lắc',
  'bò né bông thiên lý',
  'gà đồi hấp lá chanh',
  'gà nướng mật ong rừng',
  'gà rang muối',
  'gà ủ muối hoa tiêu',
  'sườn nướng mật ong',
  'sườn non rim mặn ngọt',
  'ba chỉ cháy cạnh',
  'thịt kho tàu nước dừa',
  'heo quay giòn bì',
  'cá kho tộ làng Vũ Đại',
  'cá hồi áp chảo sốt chanh leo',
  'cá lăng nướng riềng mẻ',
  'cá chẽm hấp xì dầu',
  'tôm sú nướng muối ớt',
  'tôm càng xanh sốt me',
  'mực hấp gừng hành',
  'mực một nắng nướng sa tế',
  'cua Cà Mau rang me',
  'cua hấp nước dừa',
  'nghêu hấp sả ớt',
  'chả cá Lã Vọng',
  'chả tôm nướng mía',
  'nấm đông cô xào hạt sen',
  'đậu hũ non sốt nấm',
  'rau củ luộc chấm kho quẹt',
  'ngọn su su xào tỏi',
  'bông bí nhồi thịt hấp',
  'hoa chuối bóp gỏi gà',
  'hạt sen long nhãn',
  'bưởi đường phèn',
];

const MODIFIERS = [
  'Hà Nội',
  'xứ Huế',
  'Sài Gòn',
  'Tây Bắc',
  'miền Tây',
  'Đà Nẵng',
  'Hội An',
  'Nha Trang',
  'Phú Quốc',
  'Đồng Tháp',
  'Cần Thơ',
  'cung đình',
  'gia truyền',
  'bản địa',
  'hương vị xưa',
  'đặc biệt Ấm Vị',
  'thượng hạng',
  'chua cay Nam Bộ',
  'cháy tỏi thơm nồng',
  'sốt tiêu đen Phú Quốc',
  'sốt chanh leo thanh mát',
  'sốt bơ tỏi hoàng gia',
  'sốt trứng muối béo ngậy',
  'om dưa chua truyền thống',
  'kho tiêu xanh ấm bụng',
  'nướng than hoa đậm vị',
  'nấu măng tươi vùng cao',
  'hầm thuốc bắc bồi bổ',
];

const DESCRIPTIONS = [
  'Hương vị đậm đà được kết tinh từ các loại gia vị truyền thống ba miền, hòa quyện trong từng thớ thịt tươi ngon tuyển chọn.',
  'Món ăn mang đậm phong vị bản địa Việt Nam, giữ trọn vị ngọt tự nhiên của nguyên liệu tươi mới mỗi ngày.',
  'Được chế biến thủ công cầu kỳ theo công thức bí truyền của các nghệ nhân ẩm thực lâu năm.',
  'Sự kết hợp tinh tế giữa nguyên liệu tươi sạch đồng quê và phương pháp chế biến đương đại đầy sáng tạo.',
  'Vị thanh nhẹ, hậu vị sâu lắng, mang đến cho thực khách cảm giác thư thái và trọn vẹn hương sắc quê hương.',
  'Nước dùng ninh từ xương ống và thảo mộc thiên nhiên trong suốt 12 tiếng để đạt độ trong ngọt chuẩn mực.',
  'Món ngon nổi tiếng của Ấm Vị, được đông đảo thực khách yêu thích nhờ độ thơm ngậy vừa vặn, không ngấy.',
  'Nguyên liệu sạch hữu cơ được vận chuyển trực tiếp trong ngày từ các nông trại bản địa uy tín.',
];

function generate1000Dishes() {
  const list = [];
  const names = new Set();

  let pIdx = 0;
  let mIdx = 0;
  let modIdx = 0;
  let counter = 1;

  while (list.length < 1000) {
    const p = PREFIXES[pIdx % PREFIXES.length];
    const m = MAIN_ITEMS[mIdx % MAIN_ITEMS.length];
    const mod = MODIFIERS[modIdx % MODIFIERS.length];

    let name = `${p.prefix} ${m} ${mod}`;
    if (names.has(name)) {
      name = `${p.prefix} ${m} ${mod} (#${counter})`;
      counter++;
    }
    names.add(name);

    // Tránh vượt quá 100 ký tự
    if (name.length > 100) {
      name = name.slice(0, 97) + '...';
    }

    const price = Math.floor(Math.random() * 45 + 5) * 5000; // 25,000 -> 250,000 VND
    const desc = DESCRIPTIONS[list.length % DESCRIPTIONS.length];
    const isFeatured = Math.random() < 0.08; // ~8% món nổi bật

    list.push({
      name,
      description: desc,
      price,
      category: p.cat,
      imagePath: null,
      isFeatured,
    });

    pIdx++;
    if (pIdx % PREFIXES.length === 0) mIdx++;
    if (mIdx % MAIN_ITEMS.length === 0) modIdx++;
  }

  return list;
}

async function main() {
  console.log('Generating 1,000 unique Vietnamese dishes...');
  const dishes = generate1000Dishes();
  console.log(`Generated ${dishes.length} dishes.`);

  console.log('Inserting into Supabase PostgreSQL in batches...');
  const batchSize = 250;
  let inserted = 0;

  for (let i = 0; i < dishes.length; i += batchSize) {
    const batch = dishes.slice(i, i + batchSize);
    const result = await prisma.dish.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += result.count;
    console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dishes.length / batchSize)}: +${result.count} rows (Total: ${inserted})`);
  }

  const totalInDb = await prisma.dish.count();
  console.log(`\nDONE! Successfully seeded 1,000 dishes.`);
  console.log(`Current total dishes in database: ${totalInDb}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seeding error:', err);
  prisma.$disconnect();
  process.exit(1);
});
