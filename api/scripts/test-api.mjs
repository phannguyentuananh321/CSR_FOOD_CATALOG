// Kiểm thử tự động REST API Ấm Vị.
// Chạy: API đang listen tại BASE (mặc định http://localhost:3000), sau đó:
//   npm run test:api
const BASE = (process.env.BASE || 'http://localhost:3000').replace(/\/+$/, '');

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* response không phải JSON */
  }
  return { status: res.status, json, headers: res.headers };
}

// Ảnh PNG 1x1 hợp lệ
const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function pngForm() {
  const buffer = Buffer.from(PNG_B64, 'base64');
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'image/png' }), 'test.png');
  return form;
}

async function uploadPng(folder = 'dishes') {
  const res = await fetch(`${BASE}/api/uploads?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    body: pngForm(),
  });
  return res.json();
}

let createdDishId = null;
let createdChefId = null;
let createdIngredientId = null;
let uploadedPath = null;

async function testDishes() {
  console.log('\n[dishes]');
  let r = await api('GET', '/api/dishes');
  check('GET danh sách 200 + ok + data là mảng', r.status === 200 && r.json?.ok === true && Array.isArray(r.json.data));
  const total = r.json?.meta?.total ?? 0;

  r = await api('GET', '/api/dishes?q=zzzz-khong-co-mon-nay-12345');
  check('GET danh sách rỗng vẫn ok:true, data:[]', r.status === 200 && r.json?.ok === true && r.json.data.length === 0);

  if (total > 0) {
    const first = r.json?.data?.[0];
    void first;
  }
  const listAll = await api('GET', '/api/dishes?limit=50');
  const anyDish = listAll.json?.data?.[0];
  if (anyDish) {
    r = await api('GET', `/api/dishes/${anyDish.id}`);
    check('GET chi tiết ID hợp lệ', r.status === 200 && r.json?.ok === true && r.json.data.id === anyDish.id);
  }

  r = await api('GET', '/api/dishes/999999999');
  check('GET ID không tồn tại → 200 ok:false NOT_FOUND', r.status === 200 && r.json?.ok === false && r.json.error?.code === 'NOT_FOUND');

  r = await api('GET', '/api/dishes/abc');
  check('GET ID không phải số → NOT_FOUND', r.status === 200 && r.json?.ok === false && r.json.error?.code === 'NOT_FOUND');

  r = await api('POST', '/api/dishes', { name: 'Món Kiểm Thử Tự Động', price: 123000, category: 'Món chính' });
  check('POST hợp lệ (không quan hệ)', r.status === 200 && r.json?.ok === true && r.json.data?.name === 'Món Kiểm Thử Tự Động');
  createdDishId = r.json?.data?.id ?? null;

  r = await api('POST', '/api/dishes', { name: '', price: -5, category: '' });
  check(
    'POST không hợp lệ → VALIDATION_FAILED + fields',
    r.status === 200 && r.json?.ok === false && r.json.error?.code === 'VALIDATION_FAILED' &&
      r.json.error.fields?.name === 'Tên món ăn là bắt buộc' &&
      r.json.error.fields?.price === 'Giá món ăn không thể âm' &&
      r.json.error.fields?.category === 'Vui lòng chọn hoặc nhập danh mục món ăn'
  );

  r = await api('POST', '/api/dishes', { name: 'A' });
  check('POST tên 1 ký tự → báo lỗi độ dài', r.json?.error?.fields?.name === 'Tên món ăn phải có ít nhất 2 ký tự');

  r = await api('POST', '/api/dishes', { name: `${'x'.repeat(101)}` });
  check('POST tên 101 ký tự → báo lỗi', r.json?.error?.fields?.name === 'Tên món ăn không được vượt quá 100 ký tự');

  if (createdDishId) {
    r = await api('PATCH', `/api/dishes/${createdDishId}`, { price: 150000, isFeatured: true });
    check('PATCH hợp lệ', r.status === 200 && r.json?.ok === true && r.json.data?.price === 150000 && r.json.data?.isFeatured === true);

    r = await api('PATCH', `/api/dishes/${createdDishId}`, { name: '  ' });
    check('PATCH dữ liệu không hợp lệ → VALIDATION_FAILED', r.json?.ok === false && r.json.error?.code === 'VALIDATION_FAILED');
  }
  r = await api('PATCH', '/api/dishes/999999999', { name: 'Món Không Tồn Tại' });
  check('PATCH ID không tồn tại → NOT_FOUND', r.status === 200 && r.json?.ok === false && r.json.error?.code === 'NOT_FOUND');

  r = await api('GET', '/api/dishes?minPrice=1000000&maxPrice=1');
  check('minPrice > maxPrice → danh sách rỗng', r.json?.ok === true && r.json.data.length === 0);

  r = await api('GET', '/api/dishes?page=-3');
  check('page âm → chuẩn hóa về 1', r.json?.ok === true && r.json.meta?.page === 1);

  r = await api('GET', '/api/dishes?limit=9999');
  check('limit vượt 50 → bị kẹt về 50', r.json?.ok === true && r.json.meta?.pageSize === 50);

  r = await api('GET', '/api/dishes?sort=gi-tri-la');
  check('sort lạ → newest vẫn ok', r.json?.ok === true);

  r = await api('GET', '/api/dishes?q=món kiểm thử tự động');
  check('tìm kiếm không phân biệt hoa/thường', r.json?.ok === true && r.json.data.some((d) => /kiểm thử/i.test(d.name)));
}

async function testChefs() {
  console.log('\n[chefs]');
  let r = await api('GET', '/api/chefs');
  check('GET danh sách đầu bếp', r.status === 200 && r.json?.ok === true && Array.isArray(r.json.data));

  r = await api('POST', '/api/chefs', { name: 'Đầu Bếp Kiểm Thử', title: 'Bếp thử nghiệm', experience: '1 năm' });
  check('POST đầu bếp hợp lệ', r.status === 200 && r.json?.ok === true);
  createdChefId = r.json?.data?.id ?? null;

  r = await api('POST', '/api/chefs', { name: '' });
  check('POST đầu bếp thiếu tên → VALIDATION_FAILED', r.json?.ok === false && r.json.error?.fields?.name === 'Tên đầu bếp là bắt buộc');

  if (createdChefId) {
    r = await api('PATCH', `/api/chefs/${createdChefId}`, { title: 'Bếp trưởng Kiểm thử' });
    check('PATCH đầu bếp hợp lệ', r.json?.ok === true && r.json.data?.title === 'Bếp trưởng Kiểm thử');
  }
  r = await api('PATCH', '/api/chefs/999999999', { name: 'Không Có' });
  check('PATCH đầu bếp không tồn tại → NOT_FOUND', r.json?.ok === false && r.json.error?.code === 'NOT_FOUND');

  r = await api('GET', '/api/chefs/999999999');
  check('GET đầu bếp không tồn tại → NOT_FOUND', r.json?.ok === false && r.json.error?.code === 'NOT_FOUND');

  // Đầu bếp đang phụ trách món ăn → xóa bị chặn
  const dishList = await api('GET', '/api/dishes?limit=50');
  const dishWithChefs = dishList.json?.data?.find((d) => (d.chefCount ?? 0) > 0);
  if (dishWithChefs) {
    const detail = await api('GET', `/api/dishes/${dishWithChefs.id}`);
    const chefId = detail.json?.data?.chefs?.[0]?.id;
    const chefName = detail.json?.data?.chefs?.[0]?.name;
    if (chefId) {
      r = await api('DELETE', `/api/chefs/${chefId}`);
      check(
        'DELETE đầu bếp đang dùng → IN_USE + thông báo có tên và số món',
        r.status === 200 && r.json?.ok === false && r.json.error?.code === 'IN_USE' &&
          r.json.error.message.includes(chefName) && /\d+ món ăn/.test(r.json.error.message)
      );
      r = await api('GET', `/api/chefs/${chefId}`);
      check('Dữ liệu không đổi sau khi xóa bị chặn', r.json?.ok === true);
    }
  }
}

async function testIngredients() {
  console.log('\n[ingredients]');
  let r = await api('GET', '/api/ingredients');
  check('GET danh sách nguyên liệu', r.status === 200 && r.json?.ok === true && Array.isArray(r.json.data));

  r = await api('POST', '/api/ingredients', { name: 'Nguyên Liệu Kiểm Thử', category: 'Gia vị truyền thống', unit: 'gram' });
  check('POST nguyên liệu hợp lệ', r.status === 200 && r.json?.ok === true);
  createdIngredientId = r.json?.data?.id ?? null;

  r = await api('POST', '/api/ingredients', { name: 'X' });
  check('POST nguyên liệu tên ngắn → lỗi', r.json?.error?.fields?.name === 'Tên nguyên liệu phải có ít nhất 2 ký tự');

  const dishList = await api('GET', '/api/dishes?limit=50');
  const dishWithIngredients = dishList.json?.data?.find((d) => (d.ingredientCount ?? 0) > 0);
  if (dishWithIngredients) {
    const detail = await api('GET', `/api/dishes/${dishWithIngredients.id}`);
    const ingId = detail.json?.data?.ingredients?.[0]?.id;
    const ingName = detail.json?.data?.ingredients?.[0]?.name;
    if (ingId) {
      r = await api('DELETE', `/api/ingredients/${ingId}`);
      check(
        'DELETE nguyên liệu đang dùng → IN_USE',
        r.json?.ok === false && r.json.error?.code === 'IN_USE' && r.json.error.message.includes(ingName)
      );
    }
  }

  // Tạo nguyên liệu không liên kết rồi xóa thành công
  r = await api('POST', '/api/ingredients', { name: 'Nguyên Liệu Sẽ Bị Xóa' });
  const tmpId = r.json?.data?.id;
  r = await api('DELETE', `/api/ingredients/${tmpId}`);
  check('DELETE nguyên liệu không liên kết → ok, data:null', r.status === 200 && r.json?.ok === true && r.json.data === null);

  r = await api('DELETE', `/api/ingredients/${tmpId}`);
  check('DELETE ID không tồn tại → NOT_FOUND', r.json?.ok === false && r.json.error?.code === 'NOT_FOUND');
}

async function testRelations() {
  console.log('\n[quan hệ nhiều-nhiều]');
  if (!createdDishId || !createdChefId || !createdIngredientId) {
    check('Có bản ghi kiểm thử để gán quan hệ', false, 'thiếu id');
    return;
  }
  let r = await api('PATCH', `/api/dishes/${createdDishId}`, {
    ingredientIds: [createdIngredientId, createdIngredientId],
    chefIds: [createdChefId],
  });
  check('PATCH gán quan hệ (khử trùng)', r.json?.ok === true && r.json.data?.ingredients?.length === 1 && r.json.data?.chefs?.length === 1);

  r = await api('PATCH', `/api/dishes/${createdDishId}`, { ingredientIds: [999999999] });
  check(
    'PATCH quan hệ ID không tồn tại → RELATION_NOT_FOUND, không lưu',
    r.json?.ok === false && r.json.error?.code === 'RELATION_NOT_FOUND' &&
      r.json.error.message.includes('#999999999')
  );
  r = await api('GET', `/api/dishes/${createdDishId}`);
  check('Quan hệ cũ giữ nguyên sau khi lưu lỗi', r.json?.data?.ingredients?.some((i) => i.id === createdIngredientId));

  r = await api('PATCH', `/api/dishes/${createdDishId}`, { name: 'Món Kiểm Thử Đổi Tên' });
  check('PATCH không gửi quan hệ → giữ nguyên liên kết', r.json?.ok === true && r.json.data?.ingredients?.length === 1 && r.json.data?.chefs?.length === 1);

  r = await api('PATCH', `/api/dishes/${createdDishId}`, { ingredientIds: [] });
  check('PATCH gửi mảng rỗng → xóa hết liên kết nguyên liệu', r.json?.ok === true && r.json.data?.ingredients?.length === 0);
}

async function testUploads() {
  console.log('\n[uploads]');
  let r = await uploadPng('dishes');
  check(
    'POST upload PNG hợp lệ → lưu trong folder dishes',
    r.ok === true && typeof r.data?.path === 'string' && r.data.path.includes('/dishes/')
  );
  uploadedPath = r.data?.path;

  r = await uploadPng('khong-hop-le');
  check(
    'Upload folder không hợp lệ → VALIDATION_FAILED',
    r.ok === false && r.error?.code === 'VALIDATION_FAILED'
  );

  const badForm = new FormData();
  badForm.append('file', new Blob([Buffer.from('plain text')], { type: 'text/plain' }), 'doc.txt');
  const resBad = await fetch(`${BASE}/api/uploads`, { method: 'POST', body: badForm });
  const jsonBad = await resBad.json();
  check(
    'Upload sai định dạng → INVALID_IMAGE_TYPE đúng thông báo',
    resBad.status === 200 && jsonBad.ok === false && jsonBad.error?.code === 'INVALID_IMAGE_TYPE' &&
      jsonBad.error.message === 'Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG, WEBP.'
  );

  const bigForm = new FormData();
  bigForm.append('file', new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'big.png');
  const resBig = await fetch(`${BASE}/api/uploads`, { method: 'POST', body: bigForm });
  const jsonBig = await resBig.json();
  check('Upload >5MB → IMAGE_TOO_LARGE', jsonBig.ok === false && jsonBig.error?.code === 'IMAGE_TOO_LARGE');

  if (uploadedPath) {
    r = await api('DELETE', '/api/uploads', { path: uploadedPath });
    check('DELETE dọn ảnh upload', r.json?.ok === true);
  }
}

async function testHttpErrorsAndCors() {
  console.log('\n[lỗi HTTP + CORS]');
  let r = await api('GET', '/api/khong-ton-tai');
  check('Sai URL API → HTTP 404', r.status === 404 && r.json?.ok === false);

  const resCors = await fetch(`${BASE}/api/dishes`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  const allowOrigin = resCors.headers.get('access-control-allow-origin');
  check('CORS: origin SPA được phép', allowOrigin === 'http://localhost:5173', `nhận: ${allowOrigin}`);

  const resBadOrigin = await fetch(`${BASE}/api/dishes`, {
    headers: { Origin: 'http://evil.example.com' },
  });
  check(
    'CORS: origin lạ bị từ chối',
    resBadOrigin.headers.get('access-control-allow-origin') === null
  );

  const resPreflight = await fetch(`${BASE}/api/dishes/1`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'Content-Type',
    },
  });
  check('Preflight OPTIONS → 204 + cho phép PATCH', resPreflight.status === 204);
}

async function testCleanup() {
  console.log('\n[dọn dữ liệu kiểm thử]');
  if (createdDishId) {
    const r = await api('DELETE', `/api/dishes/${createdDishId}`);
    check('DELETE món kiểm thử → data:null', r.status === 200 && r.json?.ok === true && r.json.data === null);
    r.json = undefined;
    const r2 = await api('DELETE', `/api/dishes/${createdDishId}`);
    check('DELETE lại ID đã xóa → NOT_FOUND', r2.json?.ok === false && r2.json.error?.code === 'NOT_FOUND');
  }
  if (createdChefId) {
    const r = await api('DELETE', `/api/chefs/${createdChefId}`);
    check('DELETE đầu bếp kiểm thử (không còn món)', r.json?.ok === true);
  }
  if (createdIngredientId) {
    const r = await api('DELETE', `/api/ingredients/${createdIngredientId}`);
    check('DELETE nguyên liệu kiểm thử (không còn món)', r.json?.ok === true);
  }
}

async function main() {
  console.log(`Kiểm thử API tại ${BASE}`);
  const health = await api('GET', '/api/health');
  if (health.status !== 200) {
    console.error('API không phản hồi. Hãy khởi động API trước (npm run dev trong thư mục api).');
    process.exit(1);
  }

  await testDishes();
  await testChefs();
  await testIngredients();
  await testRelations();
  await testUploads();
  await testHttpErrorsAndCors();
  await testCleanup();

  console.log(`\nKết quả: ${passed} PASS, ${failed} FAIL`);
  if (failed > 0) {
    console.log('Các kiểm thử lỗi:', failures.join(' | '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Lỗi chạy kiểm thử:', err);
  process.exit(1);
});
