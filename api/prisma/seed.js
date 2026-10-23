import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const chefs = [
  {
    name: 'Nguyễn Thanh Tùng',
    title: 'Bếp trưởng Điều hành',
    experience: '22 năm kinh nghiệm',
    description:
      'Từng đứng bếp tại nhiều nhà hàng Việt cao cấp ở Hà Nội và Sài Gòn, bếp trưởng Tùng theo đuổi triết lý "mùi vị bản địa, kỹ thuật tinh gọn". Ông tin rằng một món ăn ngon bắt đầu từ nguyên liệu được tôn trọng đúng mùa vụ.',
    isFeatured: true,
  },
  {
    name: 'Trần Mỹ Duyên',
    title: 'Bếp trưởng Bánh & Tráng miệng',
    experience: '12 năm kinh nghiệm',
    description:
      'Nghệ nhân chuyên về bánh dân gian ba miền, từ bánh cuốn Thanh Trì đến bánh pía Sóc Trăng. Chị Duyên luôn tìm cách kể lại câu chuyện quê hương qua từng lớp bánh mỏng tang.',
    isFeatured: true,
  },
  {
    name: 'Lê Văn Hải',
    title: 'Bếp trưởng Món nướng',
    experience: '15 năm kinh nghiệm',
    description:
      'Am hiểu nghệ thuật ướp gia vị và kiểm soát lửa than hoa, đầu bếp Hải mang hơi thở của những gian bếp miền Trung vào từng xiên nướng, khiến thực khách nhớ mãi mùi khói thơm cay nhẹ.',
    isFeatured: false,
  },
  {
    name: 'Phạm Thu Hương',
    title: 'Chuyên gia Ẩm thực Miền Trung',
    experience: '18 năm kinh nghiệm',
    description:
      'Lớn lên ở Huế, đầu bếp Hương chuyên tôn vinh sự tinh tế của ẩm thực cung đình: vị thanh, màu nhã, hình thức chỉn chu. Các món bún bò, bánh bèo của chị luôn giữ đúng hồn xứ Huế.',
    isFeatured: true,
  },
  {
    name: 'Đỗ Minh Quân',
    title: 'Bếp phó Chế biến',
    experience: '9 năm kinh nghiệm',
    description:
      'Xuất thân từ gia đình buôn gia vị chợ Đồng Xuân, bếp Quân có "mũi thính" đặc biệt với nước mắm, mắm tôm và các loại dưa chua truyền thống.',
    isFeatured: false,
  },
  {
    name: 'Vũ Thị Lan Anh',
    title: 'Nghệ nhân Đồ uống & Trà',
    experience: '8 năm kinh nghiệm',
    description:
      'Chuyên nghiên cứu các loại trà hoa, nước sâm và món giải khát dân dã Nam Bộ, nghệ nhân Lan Anh mang đến những thức uống thanh mát, dung dị mà đầy bất ngờ.',
    isFeatured: false,
  },
  {
    name: 'Bùi Quốc Bảo',
    title: 'Bếp trưởng Món xào & Canh',
    experience: '11 năm kinh nghiệm',
    description:
      'Kỹ năng xào lửa lớn và ninh nước dùng nhiều giờ của bếp Bảo được đồng nghiệp ví như "bàn tay có não", luôn giữ độ giòn ngọt tự nhiên của rau củ.',
    isFeatured: false,
  },
];

const ingredients = [
  {
    name: 'Nước mắm cốt cá cơm Phú Quốc',
    category: 'Gia vị truyền thống',
    unit: 'chai 500ml',
    description:
      'Được ủ chượp từ cá cơm tươi đánh bắt quanh đảo Phú Quốc tối thiểu 12 tháng, nước mắm cốt có màu hổ phách, vị mặn ngọt hài hòa và hương thơm đặc trưng của biển.',
  },
  {
    name: 'Bún tươi làng Đồng Tháp',
    category: 'Nông sản truyền thống',
    unit: 'kg',
    description:
      'Sợi bún được làm từ gạo tẻ ngâm nước giếng, tráng mỏng trên vải bố và phơi sương, cho sợi bún trắng mịn, dai vừa, giữ trọn hương gạo.',
  },
  {
    name: 'Thịt bò tái lăn Úc',
    category: 'Thịt & Thủy hải sản',
    unit: 'kg',
    description:
      'Thăn bò được chọn lọc, thái lát mỏng để tái lăn giữ độ mềm ngọt; phần gân nhỏ tạo độ sần sật đặc trưng cho món phở bò Hà Nội.',
  },
  {
    name: 'Rau thơm vườn Láng',
    category: 'Rau tươi',
    unit: 'bó',
    description:
      'Húng Láng, ngổ, rau mùi ta, hành hoa trồng trên phù sa sông Hồng, thơm nồng gấp đôi rau thường, là linh hồn của bát phở và các món cuốn.',
  },
  {
    name: 'Quế Trà My',
    category: 'Thảo mộc tự nhiên',
    unit: 'gram',
    description:
      'Vỏ quế khô từ rừng quế Trà My, Quảng Nam, vị cay ấm ngọt hậu, dùng ninh phở, kho thịt hoặc pha trà rất hợp.',
  },
  {
    name: 'Hải sản tươi vịnh Hạ Long',
    category: 'Thịt & Thủy hải sản',
    unit: 'kg',
    description:
      'Tôm, mực, ngao đánh bắt trong ngày tại vịnh Hạ Long, thịt chắc ngọt, làm nên các món hải sản nướng và xào đậm vị biển.',
  },
  {
    name: 'Tôm khô Cà Mau',
    category: 'Thịt & Thủy hải sản',
    unit: 'gram',
    description:
      'Tôm khô phơi nắng tự nhiên từ tôm đất Cà Mau, vỏ đỏ au, thịt đỏ chắc, ngọt đậm khi nhai, thường dùng nấu bún riêu hoặc xào su hào.',
  },
  {
    name: 'Củ sả Lai Vung',
    category: 'Thảo mộc tự nhiên',
    unit: 'bó',
    description:
      'Sả tươi cắt từ vườn Lai Vung, Đồng Tháp, thân trắng mập, tinh dầu thơm mạnh, là gia vị không thể thiếu của món gà nướng và các món lẩu chua.',
  },
  {
    name: 'Gạo ST25 Sóc Trăng',
    category: 'Nông sản truyền thống',
    unit: 'kg',
    description:
      'Giống lúa từng đoạt giải gạo ngon nhất thế giới, hạt dài, cơm mềm dẻo, ngọt hậu rõ, nấu cơm hay làm cháo đều thơm ngon.',
  },
  {
    name: 'Bột gạo lứt mộc',
    category: 'Nông sản truyền thống',
    unit: 'gram',
    description:
      'Bột xay từ gạo lứt nguyên cám không tẩy trắng, dùng tráng bánh cuốn màu ngà nhẹ, vị bùi béo tự nhiên.',
  },
];

// [tên món, danh mục, giá, mô tả, nổi bật, [tên nguyên liệu...], [tên đầu bếp...]]
const dishes = [
  [
    'Phở Bò Tái Lăn Hà Nội',
    'Món nước',
    65000,
    'Nước dùng ninh xương bò 16 giờ với quế Trà My và hành tây nướng, thịt tái lăn mềm ngọt, bánh phở trần kỹ ăn kèm rau thơm vườn Láng chấm chanh tươi.',
    true,
    ['Thịt bò tái lăn Úc', 'Rau thơm vườn Láng', 'Quế Trà My', 'Nước mắm cốt cá cơm Phú Quốc'],
    ['Nguyễn Thanh Tùng', 'Bùi Quốc Bảo'],
  ],
  [
    'Bún Bò Huế Chả Cua',
    'Món nước',
    58000,
    'Sợi bún to dai vừa, nước lèo màu đỏ dầu điều bắt mắt, chả cua béo ngậy và giò heo mềm rục, vị mắm ruốc đặc trưng xứ Huế.',
    true,
    ['Bún tươi làng Đồng Tháp', 'Quế Trà My'],
    ['Phạm Thu Hương'],
  ],
  [
    'Bánh Cuốn Thanh Trì Nóng Hổi',
    'Món cuốn',
    45000,
    'Bánh tráng mỏng tang từ bột gạo lứt mộc, nhân thịt nấm đen giòn thơm, rắc hành phi vàng ruộm, chấm nước mắm chua ngọt pha tỏi ớt giã tay.',
    false,
    ['Bột gạo lứt mộc', 'Rau thơm vườn Láng', 'Nước mắm cốt cá cơm Phú Quốc'],
    ['Trần Mỹ Duyên'],
  ],
  [
    'Chả Giò Tôm Thịt Giòn Rụm',
    'Món chiên',
    55000,
    'Vỏ bánh tráng gạo chiên giòn rụm, nhân tôm thịt quết dẻo thơm hành tây, ăn kèm rau sống chấm nước mắm pha chua ngọt.',
    false,
    ['Hải sản tươi vịnh Hạ Long', 'Rau thơm vườn Láng'],
    ['Đỗ Minh Quân'],
  ],
  [
    'Gà Nướng Sả Ớt Kiểu Mường',
    'Món nướng',
    180000,
    'Gà đồi ướp sả Lai Vung, ớt xiêm xanh và mật ong rừng, nướng than hoa chậm 40 phút đến khi da vàng óng, thịt mọng nước thơm mùi sả nướng.',
    true,
    ['Củ sả Lai Vung'],
    ['Lê Văn Hải'],
  ],
  [
    'Tôm Nướng Muối Ớt Vịnh Hạ Long',
    'Món nướng',
    165000,
    'Tôm sú tươi nướng nguyên con trên than hoa, tẩm muối hạt và ớt tươi giã, vỏ cháy xém thơm, thịt ngọt đậm vị biển.',
    false,
    ['Hải sản tươi vịnh Hạ Long'],
    ['Lê Văn Hải'],
  ],
  [
    'Cơm Niêu Gạo ST25 Kho Quẹt',
    'Món chính',
    75000,
    'Cơm niêu đất nấu từ gạo ST25, cháy cạnh giòn thơm, ăn kèm kho quẹt tôm khô Cà Mau với cơm cháy nhúng nước kho béo mặn.',
    true,
    ['Gạo ST25 Sóc Trăng', 'Tôm khô Cà Mau'],
    ['Nguyễn Thanh Tùng', 'Đỗ Minh Quân'],
  ],
  [
    'Mực Xào Su Hào Tôm Khô',
    'Món xào',
    98000,
    'Mực ống tươi xào lửa lớn với su hào giòn ngọt, độ béo của mực hòa cùng vị ngọt đậm tôm khô Cà Mau, rưới chút dầu hào và hành lá.',
    false,
    ['Hải sản tươi vịnh Hạ Long', 'Tôm khô Cà Mau'],
    ['Bùi Quốc Bảo'],
  ],
  [
    'Bánh Flan Trứng Nước Cốt Dừa',
    'Tráng miệng',
    35000,
    'Bánh flan mịn màng tan ngay đầu lưỡi, nước caramel đắng nhẹ phủ trên cùng chút nước cốt dừa béo thơm và đá bào mát lạnh.',
    false,
    [],
    ['Trần Mỹ Duyên'],
  ],
  [
    'Trà Hoa Cúc Mật Ong Hạt Chia',
    'Đồ uống',
    39000,
    'Trà hoa cúc vàng hãm nóng, pha cùng mật ong hoa nhãn và hạt chia nở mềm, thức uống thanh nhiệt dịu nhẹ cho ngày hè.',
    false,
    [],
    ['Vũ Thị Lan Anh'],
  ],
  [
    'Bún Riêu Tôm Khô Cua Đồng',
    'Món nước',
    52000,
    'Riêu cua đồng bông mềm, nước dùng chua thanh từ khế và dấm bỗng, tôm khô Cà Mau rim mặn ngọt nở bung trên bún tươi.',
    false,
    ['Bún tươi làng Đồng Tháp', 'Tôm khô Cà Mau'],
    ['Phạm Thu Hương'],
  ],
  [
    'Gỏi Cuốn Tôm Thịt Tươi Mát',
    'Món cuốn',
    48000,
    'Bánh tráng cuốn tôm luộc, thịt ba chỉ, bún tươi và rau thơm đủ loại, chấm tương đậu phộng béo bùi giã tay mỗi buổi sáng.',
    false,
    ['Hải sản tươi vịnh Hạ Long', 'Bún tươi làng Đồng Tháp', 'Rau thơm vườn Láng'],
    ['Đỗ Minh Quân', 'Trần Mỹ Duyên'],
  ],
  [
    'Cá Lóc Nướng Trui Cuốn Bánh Tráng',
    'Món nướng',
    145000,
    'Cá lóc đồng nướng trui nguyên con áp lửa rơm, da giòn thơm mùi khói, cuốn bánh tráng với rau nhúc, bún tươi và nước chấm mắm nêm pha dứa.',
    false,
    ['Rau thơm vườn Láng', 'Bún tươi làng Đồng Tháp', 'Nước mắm cốt cá cơm Phú Quốc'],
    ['Lê Văn Hải'],
  ],
  [
    'Canh Chua Cá Bông Lau Đồng Tháp Mười',
    'Món chính',
    88000,
    'Cá bông lau thịt trắng ngọt nấu canh chua với dứa, cà chua, giá đỗ và rau ngổ, vị chua dịu tự nhiên, thơm mùi ngò gai và nước mắm cốt.',
    false,
    ['Nước mắm cốt cá cơm Phú Quốc'],
    ['Bùi Quốc Bảo'],
  ],
];

async function main() {
  const dishCount = await prisma.dish.count();
  if (dishCount > 0) {
    console.log(`[seed] Đã có ${dishCount} món ăn trong database — bỏ qua seed để giữ dữ liệu hiện có.`);
    return;
  }

  const chefRows = [];
  for (const chef of chefs) {
    chefRows.push(await prisma.chef.create({ data: chef }));
  }

  const ingredientRows = [];
  for (const ingredient of ingredients) {
    ingredientRows.push(await prisma.ingredient.create({ data: ingredient }));
  }

  const chefByName = new Map(chefRows.map((c) => [c.name, c.id]));
  const ingredientByName = new Map(ingredientRows.map((i) => [i.name, i.id]));

  for (const [name, category, price, description, isFeatured, ingredientNames, chefNames] of dishes) {
    const dish = await prisma.dish.create({
      data: { name, category, price, description, isFeatured },
    });
    for (const ingredientName of new Set(ingredientNames)) {
      const ingredientId = ingredientByName.get(ingredientName);
      if (ingredientId) {
        await prisma.dishIngredient.create({
          data: { dishId: dish.id, ingredientId },
        });
      }
    }
    for (const chefName of new Set(chefNames)) {
      const chefId = chefByName.get(chefName);
      if (chefId) {
        await prisma.dishChef.create({ data: { dishId: dish.id, chefId } });
      }
    }
  }

  console.log(
    `[seed] Đã tạo ${dishes.length} món ăn, ${chefRows.length} đầu bếp, ${ingredientRows.length} nguyên liệu.`
  );
}

main()
  .catch((err) => {
    console.error('[seed] Lỗi khi seed dữ liệu:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
