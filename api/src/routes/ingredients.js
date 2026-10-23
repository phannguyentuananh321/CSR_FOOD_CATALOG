import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { removeImage } from '../lib/storage.js';
import { h, inUseError, notFoundError, ok, validationError } from '../utils/errors.js';
import {
  serializeIngredientDetail,
  serializeIngredientListItem,
} from '../utils/serializers.js';
import {
  optionalText,
  parseIdParam,
  parseListQuery,
  validateName,
} from '../utils/validate.js';

const router = Router();

const INGREDIENT_NOT_FOUND = 'Không tìm thấy nguyên liệu.';
const NAME_MESSAGES = {
  required: 'Tên nguyên liệu là bắt buộc',
  tooShort: 'Tên nguyên liệu phải có ít nhất 2 ký tự',
  tooLong: 'Tên nguyên liệu không được vượt quá 100 ký tự',
};

const INGREDIENT_INCLUDE_DETAIL = {
  dishes: { include: { dish: true } },
};

function validateIngredientPayload(body, { isCreate }) {
  const fields = {};
  const data = {};

  if (isCreate || body.name !== undefined) {
    const name = validateName(body.name, NAME_MESSAGES);
    if (name.error) fields.name = name.error;
    else data.name = name.name;
  }

  for (const [key, maxLength] of [['category', 100], ['unit', 50], ['description', 2000]]) {
    const value = optionalText(body[key], maxLength);
    if (value !== undefined) data[key] = value;
  }

  const imagePath = optionalText(body.imagePath, 500);
  if (imagePath !== undefined) data.imagePath = imagePath;

  return { fields, data, hasFieldErrors: Object.keys(fields).length > 0 };
}

// GET /api/ingredients
router.get(
  '/',
  h(async (req, res) => {
    const query = parseListQuery(req.query);
    const where = {};
    if (query.q) where.name = { contains: query.q, mode: 'insensitive' };
    if (query.category) where.category = query.category;

    const [total, rows, categoryRows] = await prisma.$transaction([
      prisma.ingredient.count({ where }),
      prisma.ingredient.findMany({
        where,
        orderBy: [{ id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { _count: { select: { dishes: true } } },
      }),
      prisma.ingredient.findMany({ select: { category: true }, distinct: ['category'] }),
    ]);

    const categories = categoryRows
      .map((row) => row.category?.trim())
      .filter((c) => c)
      .sort((a, b) => a.localeCompare(b, 'vi'));
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    res.json({
      ok: true,
      data: rows.map(serializeIngredientListItem),
      meta: { total, page: query.page, pageSize: query.limit, totalPages, categories },
    });
  })
);

// GET /api/ingredients/:id
router.get(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(INGREDIENT_NOT_FOUND);
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
      include: INGREDIENT_INCLUDE_DETAIL,
    });
    if (!ingredient) throw notFoundError(INGREDIENT_NOT_FOUND);
    ok(res, serializeIngredientDetail(ingredient));
  })
);

// POST /api/ingredients
router.post(
  '/',
  h(async (req, res) => {
    const { fields, data, hasFieldErrors } = validateIngredientPayload(req.body || {}, {
      isCreate: true,
    });
    if (hasFieldErrors) throw validationError(fields);

    const ingredient = await prisma.ingredient.create({
      data,
      include: INGREDIENT_INCLUDE_DETAIL,
    });
    ok(res, serializeIngredientDetail(ingredient));
  })
);

// PATCH /api/ingredients/:id
router.patch(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(INGREDIENT_NOT_FOUND);
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) throw notFoundError(INGREDIENT_NOT_FOUND);

    const { fields, data, hasFieldErrors } = validateIngredientPayload(req.body || {}, {
      isCreate: false,
    });
    if (hasFieldErrors) throw validationError(fields);

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data,
      include: INGREDIENT_INCLUDE_DETAIL,
    });
    ok(res, serializeIngredientDetail(ingredient));
  })
);

// DELETE /api/ingredients/:id — bị chặn nếu nguyên liệu đang được dùng.
router.delete(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(INGREDIENT_NOT_FOUND);
    const existing = await prisma.ingredient.findUnique({
      where: { id },
      include: { _count: { select: { dishes: true } } },
    });
    if (!existing) throw notFoundError(INGREDIENT_NOT_FOUND);

    const dishCount = existing._count.dishes;
    if (dishCount > 0) {
      throw inUseError(
        `Không thể xóa nguyên liệu "${existing.name}" vì đang được dùng trong ${dishCount} món ăn. Vui lòng gỡ liên kết với các món ăn trước.`
      );
    }

    await prisma.ingredient.delete({ where: { id } });

    if (existing.imagePath) {
      await removeImage(existing.imagePath).catch((err) => {
        console.error('[storage] Không xóa được ảnh nguyên liệu:', err.message);
      });
    }

    ok(res, null);
  })
);

export default router;
