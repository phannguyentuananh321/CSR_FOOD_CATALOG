export function formatPrice(price: number | null | undefined): string {
  return `${Number(price ?? 0).toLocaleString('vi-VN')} ₫`;
}

export function formatPriceHero(price: number | null | undefined): string {
  return `${Number(price ?? 0).toLocaleString('vi-VN')} đ`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
}

export function entityCode(type: 'dish' | 'chef' | 'ingredient', id: number): string {
  const prefix = type === 'dish' ? 'DISH' : type === 'chef' ? 'CHEF' : 'ING';
  return `#${prefix}-${id}`;
}

export function removeVietnameseTones(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export const DEFAULT_DISH_DESCRIPTION =
  'Món ăn mang đậm phong vị Việt Nam, được chế biến từ những nguyên liệu tươi ngon chọn lọc theo công thức độc đáo.';

export const DEFAULT_CHEF_DESCRIPTION =
  'Nghệ nhân ẩm thực tâm huyết với nhiều năm gắn bó cùng bếp lửa Việt, luôn tìm cách gìn giữ hương vị bản địa trong từng món ăn.';

export const DEFAULT_INGREDIENT_DESCRIPTION =
  'Nguyên liệu được tuyển chọn kỹ lưỡng từ những vùng đất nổi tiếng, giữ trọn hương vị và chất lượng tự nhiên.';
