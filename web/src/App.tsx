import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
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
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ActivatePage from './pages/auth/ActivatePage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UserPreferencesProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dishes" replace />} />

              {/* Public browsing routes */}
              <Route path="/dishes" element={<DishListPage />} />
              <Route path="/dishes/:id" element={<DishDetailPage />} />
              <Route path="/chefs" element={<ChefListPage />} />
              <Route path="/chefs/:id" element={<ChefDetailPage />} />
              <Route path="/ingredients" element={<IngredientListPage />} />
              <Route path="/ingredients/:id" element={<IngredientDetailPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />

              {/* Authentication routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/activate" element={<ActivatePage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Admin routes */}
              <Route
                path="/admin/dishes"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDishListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dishes/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <DishFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dishes/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <DishFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dishes/:id/delete"
                element={
                  <ProtectedRoute requireAdmin>
                    <DeleteConfirmPage resource="dishes" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/chefs"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminChefListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/chefs/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <ChefFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/chefs/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <ChefFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/chefs/:id/delete"
                element={
                  <ProtectedRoute requireAdmin>
                    <DeleteConfirmPage resource="chefs" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ingredients"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminIngredientListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ingredients/new"
                element={
                  <ProtectedRoute requireAdmin>
                    <IngredientFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ingredients/:id/edit"
                element={
                  <ProtectedRoute requireAdmin>
                    <IngredientFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ingredients/:id/delete"
                element={
                  <ProtectedRoute requireAdmin>
                    <DeleteConfirmPage resource="ingredients" />
                  </ProtectedRoute>
                }
              />

              <Route path="/500" element={<ServerErrorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </UserPreferencesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
