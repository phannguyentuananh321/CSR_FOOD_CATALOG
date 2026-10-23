export function serializeDishListItem(dish) {
  return {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    price: dish.price,
    category: dish.category,
    imagePath: dish.imagePath,
    isFeatured: dish.isFeatured,
    createdAt: dish.createdAt,
    updatedAt: dish.updatedAt,
    ingredientCount: dish._count?.ingredients ?? undefined,
    chefCount: dish._count?.chefs ?? undefined,
  };
}

export function serializeDishDetail(dish) {
  return {
    ...serializeDishListItem(dish),
    ingredients: dish.ingredients.map((row) => serializeIngredientBrief(row.ingredient ?? row)),
    chefs: dish.chefs.map((row) => serializeChefBrief(row.chef ?? row)),
  };
}

export function serializeDishBrief(dish) {
  return {
    id: dish.id,
    name: dish.name,
    price: dish.price,
    category: dish.category,
    imagePath: dish.imagePath,
    isFeatured: dish.isFeatured,
  };
}

export function serializeChefBrief(chef) {
  return {
    id: chef.id,
    name: chef.name,
    title: chef.title,
    experience: chef.experience,
    imagePath: chef.imagePath,
  };
}

export function serializeChefListItem(chef) {
  return {
    id: chef.id,
    name: chef.name,
    title: chef.title,
    description: chef.description,
    experience: chef.experience,
    imagePath: chef.imagePath,
    isFeatured: chef.isFeatured,
    createdAt: chef.createdAt,
    updatedAt: chef.updatedAt,
    dishCount: chef._count?.dishes ?? undefined,
  };
}

export function serializeChefDetail(chef) {
  return {
    ...serializeChefListItem(chef),
    dishes: chef.dishes.map((row) => serializeDishBrief(row.dish ?? row)),
  };
}

export function serializeIngredientBrief(ingredient) {
  return {
    id: ingredient.id,
    name: ingredient.name,
    category: ingredient.category,
    unit: ingredient.unit,
    imagePath: ingredient.imagePath,
  };
}

export function serializeIngredientListItem(ingredient) {
  return {
    id: ingredient.id,
    name: ingredient.name,
    category: ingredient.category,
    description: ingredient.description,
    unit: ingredient.unit,
    imagePath: ingredient.imagePath,
    createdAt: ingredient.createdAt,
    updatedAt: ingredient.updatedAt,
    dishCount: ingredient._count?.dishes ?? undefined,
  };
}

export function serializeIngredientDetail(ingredient) {
  return {
    ...serializeIngredientListItem(ingredient),
    dishes: ingredient.dishes.map((row) => serializeDishBrief(row.dish ?? row)),
  };
}
