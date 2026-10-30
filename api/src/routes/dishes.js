import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { removeImage } from '../lib/storage.js';
import { assertRelationsExist } from '../services/relations.js';
import { searchDishes } from '../services/search.js';
import { h, notFoundError, ok, validationError } from '../utils/errors.js';
import { serializeDishDetail, serializeDishListItem } from '../utils/serializers.js';
import {
  normalizeIdArray,
  optionalText,
  parseBoolean,
  parseIdParam,
  parseListQuery,
  sortToOrderBy,
  validateCategory,
  validateName,
  validatePrice,
} from '../utils/validate.js';

const router = Router();

const DISH_NOT_FOUND = 'Không tìm thấy món ăn.';
const NAME_MESSAGES = {
  required: 'Tên món ăn là bắt buộc',
  tooShort: 'Tên món ăn phải có ít nhất 2 ký tự',
  tooLong: 'Tên món ăn không được vượt quá 100 ký tự',
};

const DISH_INCLUDE_DETAIL = {
  ingredients: { include: { ingredient: true } },
  chefs: { include: { chef: true } },
};

// Supabase pooler có thể phản hồi chậm (đặc biệt khi truy cập từ xa),
// nới thời gian chờ để transaction tương tác không bị đóng giữa chừng.
const TX_OPTIONS = { maxWait: 10000, timeout: 20000 };

let cachedCategories = null;
let lastCategoryFetch = 0;
const CATEGORY_CACHE_TTL_MS = 60000;

async function getCategories() {
  const now = Date.now();
  if (cachedCategories && now - lastCategoryFetch < CATEGORY_CACHE_TTL_MS) {
    return cachedCategories;
  }
  const categoryRows = await prisma.dish.findMany({ select: { category: true }, distinct: ['category'] });
  cachedCategories = categoryRows
    .map((row) => row.category?.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'vi'));
  lastCategoryFetch = now;
  return cachedCategories;
}

function invalidateCategoryCache() {
  cachedCategories = null;
}

function buildWhere({ q, category, minPrice, maxPrice, featured, ids }) {
  const where = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (category) where.category = category;
  if (featured) where.isFeatured = true;
  if (ids && ids.length > 0) where.id = { in: ids };
  if (minPrice !== null && minPrice !== undefined) where.price = { ...(where.price || {}), gte: minPrice };
  if (maxPrice !== null && maxPrice !== undefined) where.price = { ...(where.price || {}), lte: maxPrice };
  return where;
}

// Validate body cho cả tạo mới và sửa một phần (PATCH chỉ kiểm tra field được gửi).
function validateDishPayload(body, { isCreate }) {
  const fields = {};
  const data = {};

  // PATCH không gửi tên → giữ nguyên, không validate.
  if (isCreate || body.name !== undefined) {
    const name = validateName(body.name, NAME_MESSAGES);
    if (name.error) fields.name = name.error;
    else if (name.name !== undefined) data.name = name.name;
  }

  const price = validatePrice(body.price);
  if (price.error) fields.price = price.error;
  else if (price.price !== undefined) data.price = price.price;

  const category = validateCategory(body.category, {
    isCreate,
    defaultValue: 'Món chính',
  });
  if (category.error) fields.category = category.error;
  else if (category.category !== undefined) data.category = category.category;

  const description = optionalText(body.description);
  if (description !== undefined) data.description = description;

  const isFeatured = parseBoolean(body.isFeatured);
  if (isFeatured !== undefined) data.isFeatured = isFeatured;

  const imagePath = optionalText(body.imagePath, 500);
  if (imagePath !== undefined) data.imagePath = imagePath;

  const ingredients = normalizeIdArray(body.ingredientIds);
  const chefs = normalizeIdArray(body.chefIds);

  return { fields, data, ingredients, chefs, hasFieldErrors: Object.keys(fields).length > 0 };
}

async function findDishOrThrow(id) {
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: DISH_INCLUDE_DETAIL,
  });
  if (!dish) throw notFoundError(DISH_NOT_FOUND);
  return dish;
}

// GET /api/dishes
router.get(
  '/',
  h(async (req, res) => {
    const query = parseListQuery(req.query);
    const featured = req.query.featured === '1' || req.query.featured === 'true';

    let total = 0;
    let rows = [];

    if (query.q) {
      const searchResult = await searchDishes({
        q: query.q,
        category: query.category,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        featured,
        ids: query.ids,
        sort: query.sort,
        page: query.page,
        limit: query.limit,
      });
      total = searchResult.total;
      if (searchResult.ids.length > 0) {
        const found = await prisma.dish.findMany({
          where: { id: { in: searchResult.ids } },
          include: {
            _count: { select: { ingredients: true, chefs: true } },
          },
        });
        const map = new Map(found.map((item) => [item.id, item]));
        rows = searchResult.ids.map((id) => map.get(id)).filter(Boolean);
      }
    } else {
      const where = buildWhere({ ...query, featured });
      const [count, list] = await prisma.$transaction([
        prisma.dish.count({ where }),
        prisma.dish.findMany({
          where,
          orderBy: sortToOrderBy(query.sort),
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          include: {
            _count: { select: { ingredients: true, chefs: true } },
          },
        }),
      ]);
      total = count;
      rows = list;
    }

    const categories = await getCategories();
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    res.json({
      ok: true,
      data: rows.map(serializeDishListItem),
      meta: { total, page: query.page, pageSize: query.limit, totalPages, categories },
    });
  })
);

// GET /api/dishes/:id
router.get(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(DISH_NOT_FOUND);
    const dish = await findDishOrThrow(id);
    ok(res, serializeDishDetail(dish));
  })
);

// POST /api/dishes
router.post(
  '/',
  h(async (req, res) => {
    const { fields, data, ingredients, chefs, hasFieldErrors } = validateDishPayload(
      req.body || {},
      { isCreate: true }
    );
    if (hasFieldErrors) throw validationError(fields);

    await assertRelationsExist({
      ingredientIds: ingredients.ids,
      chefIds: chefs.ids,
      invalidIngredients: ingredients.invalid,
      invalidChefs: chefs.invalid,
    });

    const dish = await prisma.$transaction(async (tx) => {
      const created = await tx.dish.create({
        data,
        include: DISH_INCLUDE_DETAIL,
      });
      if (ingredients.ids.length > 0) {
        await tx.dishIngredient.createMany({
          data: ingredients.ids.map((ingredientId) => ({ dishId: created.id, ingredientId })),
          skipDuplicates: true,
        });
      }
      if (chefs.ids.length > 0) {
        await tx.dishChef.createMany({
          data: chefs.ids.map((chefId) => ({ dishId: created.id, chefId })),
          skipDuplicates: true,
        });
      }
      return tx.dish.findUnique({ where: { id: created.id }, include: DISH_INCLUDE_DETAIL });
    }, TX_OPTIONS);

    invalidateCategoryCache();
    ok(res, serializeDishDetail(dish));
  })
);

// PATCH /api/dishes/:id
router.patch(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(DISH_NOT_FOUND);
    const existing = await prisma.dish.findUnique({ where: { id } });
    if (!existing) throw notFoundError(DISH_NOT_FOUND);

    const { fields, data, ingredients, chefs, hasFieldErrors } = validateDishPayload(
      req.body || {},
      { isCreate: false }
    );
    if (hasFieldErrors) throw validationError(fields);

    await assertRelationsExist({
      ingredientIds: ingredients.ids,
      chefIds: chefs.ids,
      invalidIngredients: ingredients.invalid,
      invalidChefs: chefs.invalid,
    });

    const dish = await prisma.$transaction(async (tx) => {
      const updated = await tx.dish.update({ where: { id }, data });
      if (ingredients.provided) {
        await tx.dishIngredient.deleteMany({
          where: { dishId: id, ingredientId: { notIn: ingredients.ids } },
        });
        if (ingredients.ids.length > 0) {
          await tx.dishIngredient.createMany({
            data: ingredients.ids.map((ingredientId) => ({ dishId: id, ingredientId })),
            skipDuplicates: true,
          });
        }
      }
      if (chefs.provided) {
        await tx.dishChef.deleteMany({
          where: { dishId: id, chefId: { notIn: chefs.ids } },
        });
        if (chefs.ids.length > 0) {
          await tx.dishChef.createMany({
            data: chefs.ids.map((chefId) => ({ dishId: id, chefId })),
            skipDuplicates: true,
          });
        }
      }
      return tx.dish.findUnique({ where: { id: updated.id }, include: DISH_INCLUDE_DETAIL });
    }, TX_OPTIONS);

    invalidateCategoryCache();
    ok(res, serializeDishDetail(dish));
  })
);

// DELETE /api/dishes/:id
router.delete(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(DISH_NOT_FOUND);
    const existing = await prisma.dish.findUnique({ where: { id } });
    if (!existing) throw notFoundError(DISH_NOT_FOUND);

    await prisma.$transaction(async (tx) => {
      await tx.dishIngredient.deleteMany({ where: { dishId: id } });
      await tx.dishChef.deleteMany({ where: { dishId: id } });
      await tx.dish.delete({ where: { id } });
    }, TX_OPTIONS);

    invalidateCategoryCache();

    // Xóa ảnh sau khi bản ghi đã xóa thành công; lỗi ảnh không làm hỏng thao tác chính.
    if (existing.imagePath) {
      await removeImage(existing.imagePath).catch((err) => {
        console.error('[storage] Không xóa được ảnh món ăn:', err.message);
      });
    }

    ok(res, null);
  })
);

export default router;
