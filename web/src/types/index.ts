export interface EntityMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  meta: EntityMeta & { categories?: string[] };
}

export interface DishBrief {
  id: number;
  name: string;
  price: number;
  category: string;
  imagePath: string | null;
  isFeatured: boolean;
}

export interface Dish {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imagePath: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  ingredientCount?: number;
  chefCount?: number;
  ingredients?: IngredientBrief[];
  chefs?: ChefBrief[];
}

export interface ChefBrief {
  id: number;
  name: string;
  title: string | null;
  experience: string | null;
  imagePath: string | null;
}

export interface Chef {
  id: number;
  name: string;
  title: string | null;
  description: string | null;
  experience: string | null;
  imagePath: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  dishCount?: number;
  dishes?: DishBrief[];
}

export interface IngredientBrief {
  id: number;
  name: string;
  category: string | null;
  unit: string | null;
  imagePath: string | null;
}

export interface Ingredient {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  unit: string | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  dishCount?: number;
  dishes?: DishBrief[];
}

export interface UploadResult {
  path: string;
}

export type Notice = { type: 'success' | 'error'; text: string };
