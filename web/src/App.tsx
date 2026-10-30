import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import { ErrorBoundary, NotFoundPage, ServerErrorPage } from './pages/ErrorPages';
import BookmarksPage from './pages/public/BookmarksPage';
import ChefDetailPage from './pages/public/ChefDetailPage';
import ChefListPage from './pages/public/ChefListPage';
import DishDetailPage from './pages/public/DishDetailPage';
import DishListPage from './pages/public/DishListPage';
import IngredientDetailPage from './pages/public/IngredientDetailPage';
import IngredientListPage from './pages/public/IngredientListPage';
import AdminChefListPage from './pages/admin/AdminChefListPage';
import AdminDishListPage from './pages/admin/AdminDishListPage';
import AdminIngredientListPage from './pages/admin/AdminIngredientListPage';
import ChefFormPage from './pages/admin/ChefFormPage';
import DeleteConfirmPage from './pages/admin/DeleteConfirmPage';
import DishFormPage from './pages/admin/DishFormPage';
import IngredientFormPage from './pages/admin/IngredientFormPage';

export default function App() {
  return (
    <ErrorBoundary>
      <UserPreferencesProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dishes" replace />} />

            <Route path="/dishes" element={<DishListPage />} />
            <Route path="/dishes/:id" element={<DishDetailPage />} />
            <Route path="/chefs" element={<ChefListPage />} />
            <Route path="/chefs/:id" element={<ChefDetailPage />} />
            <Route path="/ingredients" element={<IngredientListPage />} />
            <Route path="/ingredients/:id" element={<IngredientDetailPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />

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
      </UserPreferencesProvider>
    </ErrorBoundary>
  );
}
