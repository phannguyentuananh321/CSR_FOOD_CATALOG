import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function searchDishes({
  q = '',
  category = '',
  minPrice = null,
  maxPrice = null,
  featured = false,
  ids = null,
  sort = 'newest',
  page = 1,
  limit = 9,
} = {}) {
  const conditions = [];

  if (q) {
    conditions.push(Prisma.sql`(
      unaccent(lower(name || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))) LIKE '%' || unaccent(lower(${q})) || '%'
      OR to_tsvector('simple', unaccent(name || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))) @@ plainto_tsquery('simple', unaccent(${q}))
      OR word_similarity(unaccent(lower(${q})), unaccent(lower(name))) >= 0.4
    )`);
  }

  if (category) {
    conditions.push(Prisma.sql`category = ${category}`);
  }
  if (featured) {
    conditions.push(Prisma.sql`"isFeatured" = true`);
  }
  if (minPrice !== null && minPrice !== undefined) {
    conditions.push(Prisma.sql`price >= ${minPrice}`);
  }
  if (maxPrice !== null && maxPrice !== undefined) {
    conditions.push(Prisma.sql`price <= ${maxPrice}`);
  }
  if (ids && ids.length > 0) {
    conditions.push(Prisma.sql`id IN (${Prisma.join(ids)})`);
  }

  const whereClause =
    conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

  let orderByClause;
  if (q) {
    if (sort === 'price-asc') orderByClause = Prisma.sql`ORDER BY search_rank DESC, price ASC, id DESC`;
    else if (sort === 'price-desc') orderByClause = Prisma.sql`ORDER BY search_rank DESC, price DESC, id DESC`;
    else if (sort === 'name-asc') orderByClause = Prisma.sql`ORDER BY search_rank DESC, name ASC, id DESC`;
    else if (sort === 'name-desc') orderByClause = Prisma.sql`ORDER BY search_rank DESC, name DESC, id DESC`;
    else orderByClause = Prisma.sql`ORDER BY search_rank DESC, "createdAt" DESC, id DESC`;
  } else {
    if (sort === 'price-asc') orderByClause = Prisma.sql`ORDER BY price ASC, id DESC`;
    else if (sort === 'price-desc') orderByClause = Prisma.sql`ORDER BY price DESC, id DESC`;
    else if (sort === 'name-asc') orderByClause = Prisma.sql`ORDER BY name ASC, id DESC`;
    else if (sort === 'name-desc') orderByClause = Prisma.sql`ORDER BY name DESC, id DESC`;
    else orderByClause = Prisma.sql`ORDER BY "createdAt" DESC, id DESC`;
  }

  const rankExpr = q
    ? Prisma.sql`(
        CASE
          WHEN unaccent(lower(name)) = unaccent(lower(${q})) THEN 100
          WHEN unaccent(lower(name)) LIKE '%' || unaccent(lower(${q})) || '%' THEN 80
          WHEN to_tsvector('simple', unaccent(name || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))) @@ plainto_tsquery('simple', unaccent(${q})) THEN 50
          ELSE word_similarity(unaccent(lower(${q})), unaccent(lower(name))) * 40
        END
      ) AS search_rank,`
    : Prisma.empty;

  const offset = (page - 1) * limit;

  const countQuery = Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM dishes
    ${whereClause}
  `;
  const [countResult] = await prisma.$queryRaw(countQuery);
  const total = countResult?.count ?? 0;

  if (total === 0) return { total, ids: [] };

  const idQuery = Prisma.sql`
    SELECT id, ${rankExpr} true
    FROM dishes
    ${whereClause}
    ${orderByClause}
    LIMIT ${limit} OFFSET ${offset}
  `;
  const idRows = await prisma.$queryRaw(idQuery);
  return { total, ids: idRows.map((r) => r.id) };
}

export async function searchChefs({
  q = '',
  featured = false,
  ids = null,
  page = 1,
  limit = 9,
} = {}) {
  const conditions = [];

  if (q) {
    conditions.push(Prisma.sql`(
      unaccent(lower(name || ' ' || coalesce(title, '') || ' ' || coalesce(experience, '') || ' ' || coalesce(description, ''))) LIKE '%' || unaccent(lower(${q})) || '%'
      OR to_tsvector('simple', unaccent(name || ' ' || coalesce(title, '') || ' ' || coalesce(experience, '') || ' ' || coalesce(description, ''))) @@ plainto_tsquery('simple', unaccent(${q}))
      OR word_similarity(unaccent(lower(${q})), unaccent(lower(name))) >= 0.4
    )`);
  }

  if (featured) {
    conditions.push(Prisma.sql`"isFeatured" = true`);
  }
  if (ids && ids.length > 0) {
    conditions.push(Prisma.sql`id IN (${Prisma.join(ids)})`);
  }

  const whereClause =
    conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

  const orderByClause = q
    ? Prisma.sql`ORDER BY search_rank DESC, id DESC`
    : Prisma.sql`ORDER BY id DESC`;

  const rankExpr = q
    ? Prisma.sql`(
        CASE
          WHEN unaccent(lower(name)) = unaccent(lower(${q})) THEN 100
          WHEN unaccent(lower(name)) LIKE '%' || unaccent(lower(${q})) || '%' THEN 80
          WHEN to_tsvector('simple', unaccent(name || ' ' || coalesce(title, '') || ' ' || coalesce(experience, '') || ' ' || coalesce(description, ''))) @@ plainto_tsquery('simple', unaccent(${q})) THEN 50
          ELSE word_similarity(unaccent(lower(${q})), unaccent(lower(name))) * 40
        END
      ) AS search_rank,`
    : Prisma.empty;

  const offset = (page - 1) * limit;

  const [countResult] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM chefs
    ${whereClause}
  `;
  const total = countResult?.count ?? 0;
  if (total === 0) return { total, ids: [] };

  const idRows = await prisma.$queryRaw`
    SELECT id, ${rankExpr} true
    FROM chefs
    ${whereClause}
    ${orderByClause}
    LIMIT ${limit} OFFSET ${offset}
  `;
  return { total, ids: idRows.map((r) => r.id) };
}

export async function searchIngredients({
  q = '',
  category = '',
  ids = null,
  page = 1,
  limit = 9,
} = {}) {
  const conditions = [];

  if (q) {
    conditions.push(Prisma.sql`(
      unaccent(lower(name || ' ' || coalesce(category, '') || ' ' || coalesce(description, '') || ' ' || coalesce(unit, ''))) LIKE '%' || unaccent(lower(${q})) || '%'
      OR to_tsvector('simple', unaccent(name || ' ' || coalesce(category, '') || ' ' || coalesce(description, '') || ' ' || coalesce(unit, ''))) @@ plainto_tsquery('simple', unaccent(${q}))
      OR word_similarity(unaccent(lower(${q})), unaccent(lower(name))) >= 0.4
    )`);
  }

  if (category) {
    conditions.push(Prisma.sql`category = ${category}`);
  }
  if (ids && ids.length > 0) {
    conditions.push(Prisma.sql`id IN (${Prisma.join(ids)})`);
  }

  const whereClause =
    conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

  const orderByClause = q
    ? Prisma.sql`ORDER BY search_rank DESC, id DESC`
    : Prisma.sql`ORDER BY id DESC`;

  const rankExpr = q
    ? Prisma.sql`(
        CASE
          WHEN unaccent(lower(name)) = unaccent(lower(${q})) THEN 100
          WHEN unaccent(lower(name)) LIKE '%' || unaccent(lower(${q})) || '%' THEN 80
          WHEN to_tsvector('simple', unaccent(name || ' ' || coalesce(category, '') || ' ' || coalesce(description, '') || ' ' || coalesce(unit, ''))) @@ plainto_tsquery('simple', unaccent(${q})) THEN 50
          ELSE word_similarity(unaccent(lower(${q})), unaccent(lower(name))) * 40
        END
      ) AS search_rank,`
    : Prisma.empty;

  const offset = (page - 1) * limit;

  const [countResult] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM ingredients
    ${whereClause}
  `;
  const total = countResult?.count ?? 0;
  if (total === 0) return { total, ids: [] };

  const idRows = await prisma.$queryRaw`
    SELECT id, ${rankExpr} true
    FROM ingredients
    ${whereClause}
    ${orderByClause}
    LIMIT ${limit} OFFSET ${offset}
  `;
  return { total, ids: idRows.map((r) => r.id) };
}
