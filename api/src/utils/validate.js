const NAME_LIMIT = 100;

// Trả về chuỗi đã trim hoặc null; rỗng coi như null cho field không bắt buộc.
export function optionalText(value, maxLength = 2000) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

export function validateName(value, messages) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return { error: messages.required };
  }
  const name = String(value).trim();
  if (name.length < 2) return { error: messages.tooShort };
  if (name.length > NAME_LIMIT) return { error: messages.tooLong };
  return { name };
}

export function validatePrice(value, { required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    return required ? { price: 0 } : { skip: true };
  }
  const price = Number(value);
  if (!Number.isFinite(price) || !Number.isInteger(price)) {
    return { error: 'Giá món ăn phải là một số hợp lệ' };
  }
  if (price < 0) return { error: 'Giá món ăn không thể âm' };
  return { price };
}

export function validateCategory(value, { isCreate, defaultValue }) {
  if (value === undefined || value === null) {
    // Tạo mới không gửi danh mục → dùng mặc định; sửa không gửi → giữ nguyên.
    return isCreate ? { category: defaultValue } : { skip: true };
  }
  const category = String(value).trim();
  if (!category) return { error: 'Vui lòng chọn hoặc nhập danh mục món ăn' };
  return { category: category.slice(0, NAME_LIMIT) };
}

export function parseBoolean(value) {
  if (value === undefined || value === null) return undefined;
  return value === true || value === 1 || ['true', 'on', '1'].includes(String(value).toLowerCase());
}

// Chuẩn hóa danh sách ID quan hệ: khử trùng, tách phần không hợp lệ.
export function normalizeIdArray(value) {
  if (value === undefined || value === null) return { provided: false, ids: [], invalid: [] };
  if (!Array.isArray(value)) return { provided: true, ids: [], invalid: [String(value)] };
  const seen = new Set();
  const ids = [];
  const invalid = [];
  for (const entry of value) {
    const n = typeof entry === 'number' ? entry : Number(String(entry).trim());
    if (Number.isInteger(n) && n > 0) {
      if (!seen.has(n)) {
        seen.add(n);
        ids.push(n);
      }
    } else {
      invalid.push(String(entry));
    }
  }
  return { provided: true, ids, invalid };
}

export function parseIdParam(raw) {
  const id = Number(String(raw).trim());
  return Number.isInteger(id) && id > 0 ? id : null;
}

const nonNegativeNumber = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export const SORTS = ['newest', 'price-asc', 'price-desc', 'name-asc', 'name-desc'];

export function parseListQuery(query, { defaultLimit = 9 } = {}) {
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : '';
  const category =
    typeof query.category === 'string' && query.category.trim() && query.category.trim() !== 'all'
      ? query.category.trim().slice(0, 100)
      : '';
  const minPrice = nonNegativeNumber(query.minPrice);
  const maxPrice = nonNegativeNumber(query.maxPrice);
  const sort = SORTS.includes(query.sort) ? query.sort : 'newest';

  const parsedPage = Number.parseInt(query.page, 10);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const parsedLimit = Number.parseInt(query.limit, 10);
  let limit = Number.isInteger(parsedLimit) && parsedLimit >= 1 ? parsedLimit : defaultLimit;
  limit = Math.min(limit, 50); // giới hạn cứng 50 mục/trang

  let ids = null;
  if (query.ids) {
    const rawIds = Array.isArray(query.ids) ? query.ids : String(query.ids).split(',');
    const parsed = rawIds
      .map((x) => Number.parseInt(String(x).trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0);
    if (parsed.length > 0) ids = parsed;
  }

  return { q, category, minPrice, maxPrice, sort, page, limit, ids };
}

export function sortToOrderBy(sort) {
  switch (sort) {
    case 'price-asc':
      return [{ price: 'asc' }, { id: 'desc' }];
    case 'price-desc':
      return [{ price: 'desc' }, { id: 'desc' }];
    case 'name-asc':
      return [{ name: 'asc' }, { id: 'desc' }];
    case 'name-desc':
      return [{ name: 'desc' }, { id: 'desc' }];
    case 'newest':
    default:
      return [{ id: 'desc' }];
  }
}
