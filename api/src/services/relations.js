import { prisma } from '../lib/prisma.js';
import { relationNotFoundError } from '../utils/errors.js';

// Kiểm tra mọi ID quan hệ có tồn tại không; nếu có ID lạ thì ném lỗi nghiệp vụ
// trước khi ghi bất kỳ thay đổi nào (không lưu dở dang).
export async function assertRelationsExist({
  ingredientIds = [],
  chefIds = [],
  invalidIngredients = [],
  invalidChefs = [],
}) {
  const missing = { ingredients: [...invalidIngredients], chefs: [...invalidChefs] };

  if (ingredientIds.length > 0) {
    const found = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true },
    });
    const foundSet = new Set(found.map((r) => r.id));
    for (const id of ingredientIds) {
      if (!foundSet.has(id)) missing.ingredients.push(id);
    }
  }
  if (chefIds.length > 0) {
    const found = await prisma.chef.findMany({
      where: { id: { in: chefIds } },
      select: { id: true },
    });
    const foundSet = new Set(found.map((r) => r.id));
    for (const id of chefIds) {
      if (!foundSet.has(id)) missing.chefs.push(id);
    }
  }

  const parts = [];
  if (missing.ingredients.length > 0) {
    parts.push(
      `Không thể lưu vì nguyên liệu không tồn tại: ${missing.ingredients
        .map((id) => `#${id}`)
        .join(', ')}. Vui lòng chọn lại từ danh sách hợp lệ.`
    );
  }
  if (missing.chefs.length > 0) {
    parts.push(
      `Không thể lưu vì đầu bếp không tồn tại: ${missing.chefs
        .map((id) => `#${id}`)
        .join(', ')}. Vui lòng chọn lại từ danh sách hợp lệ.`
    );
  }
  if (parts.length > 0) throw relationNotFoundError(parts.join('; '));
}
