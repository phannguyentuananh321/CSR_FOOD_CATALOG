import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { removeImage } from '../lib/storage.js';
import { searchChefs } from '../services/search.js';
import { h, inUseError, notFoundError, ok, validationError } from '../utils/errors.js';
import { serializeChefDetail, serializeChefListItem } from '../utils/serializers.js';
import {
  optionalText,
  parseBoolean,
  parseIdParam,
  parseListQuery,
  validateName,
} from '../utils/validate.js';

const router = Router();

const CHEF_NOT_FOUND = 'Không tìm thấy đầu bếp.';
const NAME_MESSAGES = {
  required: 'Tên đầu bếp là bắt buộc',
  tooShort: 'Tên đầu bếp phải có ít nhất 2 ký tự',
  tooLong: 'Tên đầu bếp không được vượt quá 100 ký tự',
};

const CHEF_INCLUDE_DETAIL = {
  dishes: { include: { dish: true } },
};

function validateChefPayload(body, { isCreate }) {
  const fields = {};
  const data = {};

  // PATCH vẫn áp dụng rule tên hợp lệ nếu field được gửi lên.
  if (isCreate || body.name !== undefined) {
    const name = validateName(body.name, NAME_MESSAGES);
    if (name.error) fields.name = name.error;
    else data.name = name.name;
  }

  for (const [key, maxLength] of [['title', 150], ['experience', 150], ['description', 2000]]) {
    const value = optionalText(body[key], maxLength);
    if (value !== undefined) data[key] = value;
  }

  const isFeatured = parseBoolean(body.isFeatured);
  if (isFeatured !== undefined) data.isFeatured = isFeatured;

  const imagePath = optionalText(body.imagePath, 500);
  if (imagePath !== undefined) data.imagePath = imagePath;

  return { fields, data, hasFieldErrors: Object.keys(fields).length > 0 };
}

// GET /api/chefs
router.get(
  '/',
  h(async (req, res) => {
    const query = parseListQuery(req.query);
    const featured = req.query.featured === '1' || req.query.featured === 'true';

    let total = 0;
    let rows = [];

    if (query.q) {
      const searchResult = await searchChefs({
        q: query.q,
        featured,
        ids: query.ids,
        page: query.page,
        limit: query.limit,
      });
      total = searchResult.total;
      if (searchResult.ids.length > 0) {
        const found = await prisma.chef.findMany({
          where: { id: { in: searchResult.ids } },
          include: { _count: { select: { dishes: true } } },
        });
        const map = new Map(found.map((item) => [item.id, item]));
        rows = searchResult.ids.map((id) => map.get(id)).filter(Boolean);
      }
    } else {
      const where = {};
      if (featured) where.isFeatured = true;
      if (query.ids && query.ids.length > 0) where.id = { in: query.ids };

      const [count, list] = await prisma.$transaction([
        prisma.chef.count({ where }),
        prisma.chef.findMany({
          where,
          orderBy: [{ id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          include: { _count: { select: { dishes: true } } },
        }),
      ]);
      total = count;
      rows = list;
    }

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    res.json({
      ok: true,
      data: rows.map(serializeChefListItem),
      meta: { total, page: query.page, pageSize: query.limit, totalPages },
    });
  })
);

// GET /api/chefs/:id
router.get(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(CHEF_NOT_FOUND);
    const chef = await prisma.chef.findUnique({
      where: { id },
      include: CHEF_INCLUDE_DETAIL,
    });
    if (!chef) throw notFoundError(CHEF_NOT_FOUND);
    ok(res, serializeChefDetail(chef));
  })
);

// POST /api/chefs
router.post(
  '/',
  h(async (req, res) => {
    const { fields, data, hasFieldErrors } = validateChefPayload(req.body || {}, {
      isCreate: true,
    });
    if (hasFieldErrors) throw validationError(fields);

    const chef = await prisma.chef.create({ data, include: CHEF_INCLUDE_DETAIL });
    ok(res, serializeChefDetail(chef));
  })
);

// PATCH /api/chefs/:id
router.patch(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(CHEF_NOT_FOUND);
    const existing = await prisma.chef.findUnique({ where: { id } });
    if (!existing) throw notFoundError(CHEF_NOT_FOUND);

    const { fields, data, hasFieldErrors } = validateChefPayload(req.body || {}, {
      isCreate: false,
    });
    if (hasFieldErrors) throw validationError(fields);

    const chef = await prisma.chef.update({
      where: { id },
      data,
      include: CHEF_INCLUDE_DETAIL,
    });
    ok(res, serializeChefDetail(chef));
  })
);

// DELETE /api/chefs/:id — bị chặn nếu đầu bếp đang phụ trách món ăn.
router.delete(
  '/:id',
  h(async (req, res) => {
    const id = parseIdParam(req.params.id);
    if (!id) throw notFoundError(CHEF_NOT_FOUND);
    const existing = await prisma.chef.findUnique({
      where: { id },
      include: { _count: { select: { dishes: true } } },
    });
    if (!existing) throw notFoundError(CHEF_NOT_FOUND);

    const dishCount = existing._count.dishes;
    if (dishCount > 0) {
      throw inUseError(
        `Không thể xóa đầu bếp "${existing.name}" vì đang phụ trách ${dishCount} món ăn. Vui lòng gỡ liên kết với các món ăn trước.`
      );
    }

    await prisma.chef.delete({ where: { id } });

    if (existing.imagePath) {
      await removeImage(existing.imagePath).catch((err) => {
        console.error('[storage] Không xóa được ảnh đầu bếp:', err.message);
      });
    }

    ok(res, null);
  })
);

export default router;
