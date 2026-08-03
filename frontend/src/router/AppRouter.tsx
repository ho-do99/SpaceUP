import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import FloorPlanUploadPage from '@/pages/FloorPlanUploadPage'
import FloorPlanAnalysisLoadingPage from '@/pages/FloorPlanAnalysisLoadingPage'
import AnalysisResultPage from '@/pages/AnalysisResultPage'
import EstimatePage from '@/pages/EstimatePage'
import ReportPage from '@/pages/ReportPage'
import ContractorPage from '@/pages/ContractorPage'
import MyPage from '@/pages/MyPage'
import PropertyInformationPage from '@/pages/PropertyInformationPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<HomePage />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/upload"         element={<FloorPlanUploadPage />} />
        <Route path="/analysis/loading" element={<FloorPlanAnalysisLoadingPage />} />
        <Route path="/analysis/:id"   element={<AnalysisResultPage />} />
        <Route path="/estimate/:id"   element={<EstimatePage />} />
        <Route path="/report/:id"     element={<ReportPage />} />
        <Route path="/contractors"    element={<ContractorPage />} />
        <Route path="/mypage"         element={<MyPage />} />
        <Route path="/analysis/new/property" element={<PropertyInformationPage />} />
      </Routes>
    </BrowserRouter>
  )
}
