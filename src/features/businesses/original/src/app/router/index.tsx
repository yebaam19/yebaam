import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import AdminLayout from '../layouts/AdminLayout'
import HomePage from '../../features/home/HomePage'
import LoginPage from '../../features/auth/LoginPage'
import RegisterPage from '../../features/auth/RegisterPage'
import PromotionsPage from '../../features/promotions/PromotionsPage'
import PromotionDetailPage from '../../features/promotions/PromotionDetailPage'
import BusinessListPage from '../../features/businesses/BusinessListPage'
import ProductDetailPage from '../../features/products/ProductDetailPage'
import GalleryPage from '../../features/media/GalleryPage'
import MenuPage from '../../features/menu/MenuPage'

import { AdminGuard } from './guards'
import AdminDashboardPage from '../../features/admin/AdminDashboardPage'
import AdminBusinessPage from '../../features/admin/AdminBusinessPage'
import AdminBusinessCreatePage from '../../features/admin/AdminBusinessCreatePage'
import AdminBusinessEditPage from '../../features/admin/AdminBusinessEditPage'
import AdminBusinessesPage from '../../features/admin/AdminBusinessesPage'
import AdminBusinessAdminsPage from '../../features/admin/AdminBusinessAdminsPage'
import AdminBusinessAdminCreatePage from '../../features/admin/AdminBusinessAdminCreatePage'
import AdminBusinessAdminEditPage from '../../features/admin/AdminBusinessAdminEditPage'
import AdminActivityPage from '../../features/admin/AdminActivityPage'
import AdminProductsPage from '../../features/admin/AdminProductsPage'
import AdminMediaPage from '../../features/admin/AdminMediaPage'
import AdminPromotionsPage from '../../features/admin/AdminPromotionsPage'
import BusinessDetailPage from '../../features/businesses/BusinessDetailPage'

function NotFoundPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>404</h1>
      <p>No encontramos esta página.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/promotions/:id" element={<PromotionDetailPage />} />
          <Route path="/businesses" element={<BusinessListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/businesses/:id/gallery" element={<GalleryPage />} />
          <Route path="/businesses/:id/menu" element={<MenuPage />} />
          <Route path="/businesses/:id" element={<BusinessDetailPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route
            path="business/new"
            element={<Navigate to="/admin/businesses/new" replace />}
          />
          <Route path="businesses/new" element={<AdminBusinessCreatePage />} />
          <Route path="businesses/:id/edit" element={<AdminBusinessEditPage />} />
          <Route path="businesses" element={<AdminBusinessesPage />} />
          <Route path="business-admins" element={<AdminBusinessAdminsPage />} />
          <Route
            path="business-admins/new"
            element={<AdminBusinessAdminCreatePage />}
          />
          <Route
            path="business-admins/:id/edit"
            element={<AdminBusinessAdminEditPage />}
          />
          <Route path="activity" element={<AdminActivityPage />} />
          <Route path="business" element={<AdminBusinessPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="media" element={<AdminMediaPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
