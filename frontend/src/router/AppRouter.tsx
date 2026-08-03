import { BrowserRouter, Outlet, Routes, Route } from 'react-router-dom'
import EstimateFlowProvider from '@/contexts/EstimateFlowProvider'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import FloorPlanUploadPage from '@/pages/FloorPlanUploadPage'
import FloorPlanAnalysisLoadingPage from '@/pages/FloorPlanAnalysisLoadingPage'
import SpaceInformationPage from '@/pages/SpaceInformationPage'
import StyleSelectionPage from '@/pages/StyleSelectionPage'
import SimulationPhotoUploadPage from '@/pages/SimulationPhotoUploadPage'
import SimulationGeneratingPage from '@/pages/SimulationGeneratingPage'
import SimulationResultPage from '@/pages/SimulationResultPage'
import EstimateSummaryPage from '@/pages/EstimateSummaryPage'
import FloorMaterialSelectionPage from '@/pages/FloorMaterialSelectionPage'
import LightingMaterialSelectionPage from '@/pages/LightingMaterialSelectionPage'
import WallpaperMaterialSelectionPage from '@/pages/WallpaperMaterialSelectionPage'
import HomeValueIncreaseReportPage from '@/pages/HomeValueIncreaseReportPage'
import AnalysisResultPage from '@/pages/AnalysisResultPage'
import EstimatePage from '@/pages/EstimatePage'
import ReportPage from '@/pages/ReportPage'
import ContractorPage from '@/pages/ContractorPage'
import ContractorDetailPage from '@/pages/ContractorDetailPage'
import EstimateRequestPage from '@/pages/EstimateRequestPage'
import EstimateRequestCompletePage from '@/pages/EstimateRequestCompletePage'
import EstimateRequestHistoryPage from '@/pages/EstimateRequestHistoryPage'
import EstimateRequestDetailPage from '@/pages/EstimateRequestDetailPage'
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
        <Route path="/analysis/spaces" element={<SpaceInformationPage />} />
        <Route path="/analysis/style" element={<StyleSelectionPage />} />
        <Route path="/analysis/simulation/photo" element={<SimulationPhotoUploadPage />} />
        <Route path="/analysis/simulation/generating" element={<SimulationGeneratingPage />} />
        <Route path="/analysis/simulation/result" element={<SimulationResultPage />} />
        <Route path="/analysis/:id"   element={<AnalysisResultPage />} />
        <Route
          element={(
            <EstimateFlowProvider>
              <Outlet />
            </EstimateFlowProvider>
          )}
        >
          <Route path="/estimate/summary" element={<EstimateSummaryPage />} />
          <Route path="/estimate/materials/floor" element={<FloorMaterialSelectionPage />} />
          <Route path="/estimate/materials/wallpaper" element={<WallpaperMaterialSelectionPage />} />
          <Route path="/estimate/materials/lighting" element={<LightingMaterialSelectionPage />} />
          <Route path="/report/value-increase" element={<HomeValueIncreaseReportPage />} />
        </Route>
        <Route path="/estimate/request/complete" element={<EstimateRequestCompletePage />} />
        <Route path="/estimate/request" element={<EstimateRequestPage />} />
        <Route path="/estimate/:id"   element={<EstimatePage />} />
        <Route path="/report/:id"     element={<ReportPage />} />
        <Route path="/contractors"    element={<ContractorPage />} />
        <Route path="/contractors/:contractorId" element={<ContractorDetailPage />} />
        <Route path="/mypage/requests" element={<EstimateRequestHistoryPage />} />
        <Route path="/mypage/requests/:requestId" element={<EstimateRequestDetailPage />} />
        <Route path="/mypage"         element={<MyPage />} />
        <Route path="/analysis/new/property" element={<PropertyInformationPage />} />
      </Routes>
    </BrowserRouter>
  )
}
