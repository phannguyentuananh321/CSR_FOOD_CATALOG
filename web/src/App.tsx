import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { ErrorBoundary, NotFoundPage, ServerErrorPage } from './pages/ErrorPages';
import DishListPage from './pages/public/DishListPage';
import DishDetailPage from './pages/public/DishDetailPage';
import ChefListPage from './pages/public/ChefListPage';
import ChefDetailPage from './pages/public/ChefDetailPage';
import IngredientListPage from './pages/public/IngredientListPage';
import IngredientDetailPage from './pages/public/IngredientDetailPage';
import AdminDishListPage from './pages/admin/AdminDishListPage';
import AdminChefListPage from './pages/admin/AdminChefListPage';
import AdminIngredientListPage from './pages/admin/AdminIngredientListPage';
import DishFormPage from './pages/admin/DishFormPage';
import ChefFormPage from './pages/admin/ChefFormPage';
import IngredientFormPage from './pages/admin/IngredientFormPage';
import DeleteConfirmPage from './pages/admin/DeleteConfirmPage';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dishes" replace />} />

            <Route path="/dishes" element={<DishListPage />} />
            <Route path="/dishes/:id" element={<DishDetailPage />} />
            <Route path="/chefs" element={<ChefListPage />} />
            <Route path="/chefs/:id" element={<ChefDetailPage />} />
            <Route path="/ingredients" element={<IngredientListPage />} />
            <Route path="/ingredients/:id" element={<IngredientDetailPage />} />

            <Route path="/admin/dishes" element={<AdminDishListPage />} />
            <Route path="/admin/dishes/new" element={<DishFormPage />} />
            <Route path="/admin/dishes/:id/edit" element={<DishFormPage />} />
            <Route path="/admin/dishes/:id/delete" element={<DeleteConfirmPage resource="dishes" />} />
            <Route path="/admin/chefs" element={<AdminChefListPage />} />
            <Route path="/admin/chefs/new" element={<ChefFormPage />} />
            <Route path="/admin/chefs/:id/edit" element={<ChefFormPage />} />
            <Route path="/admin/chefs/:id/delete" element={<DeleteConfirmPage resource="chefs" />} />
            <Route path="/admin/ingredients" element={<AdminIngredientListPage />} />
            <Route path="/admin/ingredients/new" element={<IngredientFormPage />} />
            <Route path="/admin/ingredients/:id/edit" element={<IngredientFormPage />} />
            <Route path="/admin/ingredients/:id/delete" element={<DeleteConfirmPage resource="ingredients" />} />

            <Route path="/500" element={<ServerErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
    </ErrorBoundary>
  );
}
