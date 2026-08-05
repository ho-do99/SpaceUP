import {
  BrowserRouter,
  Outlet,
  Routes,
  Route,
} from 'react-router-dom'

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
import NotificationCenterPage from '@/pages/NotificationCenterPage'
import SettingsPage from '@/pages/SettingsPage'
import PropertyInformationPage from '@/pages/PropertyInformationPage'
import ApartmentAddressSearchPage from '@/pages/ApartmentAddressSearchPage'

import ContractorDashboardPage from '@/pages/contractor/ContractorDashboardPage'
import ContractorChatPage from '@/pages/contractor/ContractorChatPage'
import ContractorEstimateReadyPage from '@/pages/contractor/ContractorEstimateReadyPage'
import ContractorEstimateEditPage from '@/pages/contractor/ContractorEstimateEditPage'
import ContractorEstimatePreviewPage from '@/pages/contractor/ContractorEstimatePreviewPage'
import ContractorEstimateSentPage from '@/pages/contractor/ContractorEstimateSentPage'
import ContractorEstimateListPage from '@/pages/contractor/ContractorEstimateListPage'
import ContractorEstimateDetailPage from '@/pages/contractor/ContractorEstimateDetailPage'
import ContractorContractReadyPage from '@/pages/contractor/ContractorContractReadyPage'
import ContractorProjectListPage from '@/pages/contractor/ContractorProjectListPage'
import ContractorProjectDetailPage from '@/pages/contractor/ContractorProjectDetailPage'
import ContractorSettlementListPage from '@/pages/contractor/ContractorSettlementListPage'
import ContractorSettlementDetailPage from '@/pages/contractor/ContractorSettlementDetailPage'
import ContractorSettlementStatementPage from '@/pages/contractor/ContractorSettlementStatementPage'
import ContractorSettlementBreakdownPage from '@/pages/contractor/ContractorSettlementBreakdownPage'
import ContractorNotificationPage from '@/pages/contractor/ContractorNotificationPage'
import ContractorReviewListPage from '@/pages/contractor/ContractorReviewListPage'
import ContractorReviewDetailPage from '@/pages/contractor/ContractorReviewDetailPage'
import ContractorMyPage from '@/pages/contractor/ContractorMyPage'
import ContractorPortfolioPage from '@/pages/contractor/ContractorPortfolioPage'
import ContractorPortfolioEditPage from '@/pages/contractor/ContractorPortfolioEditPage'
import ContractorPortfolioCreatePage from '@/pages/contractor/ContractorPortfolioCreatePage'
import ContractorSettingsPage from '@/pages/contractor/ContractorSettingsPage'
import ContractorAccountSettingsPage from '@/pages/contractor/ContractorAccountSettingsPage'
import ContractorManagerInfoPage from '@/pages/contractor/ContractorManagerInfoPage'
import ContractorVisibilitySettingsPage from '@/pages/contractor/ContractorVisibilitySettingsPage'
import ContractorWithdrawalPage from '@/pages/contractor/ContractorWithdrawalPage'
import ContractorWithdrawalCompletedPage from '@/pages/contractor/ContractorWithdrawalCompletedPage'
import ContractorCompanyInfoPage from '@/pages/contractor/ContractorCompanyInfoPage'
import ContractorCompanySpecialtiesPage from '@/pages/contractor/ContractorCompanySpecialtiesPage'
import ContractorCompanyRegionsPage from '@/pages/contractor/ContractorCompanyRegionsPage'
import ContractorCompanySettlementPage from '@/pages/contractor/ContractorCompanySettlementPage'
import ContractorRequestAnalysisPage from '@/pages/contractor/ContractorRequestAnalysisPage'
import ContractorRequestApprovedPage from '@/pages/contractor/ContractorRequestApprovedPage'
import ContractorRequestDetailPage from '@/pages/contractor/ContractorRequestDetailPage'
import ContractorRequestFloorPlanPage from '@/pages/contractor/ContractorRequestFloorPlanPage'
import ContractorRequestListPage from '@/pages/contractor/ContractorRequestListPage'
import ContractorRequestPhotosPage from '@/pages/contractor/ContractorRequestPhotosPage'
import ContractorVisitPage from '@/pages/contractor/ContractorVisitPage'

import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/upload" element={<FloorPlanUploadPage />} />

        <Route
          path="/analysis/loading"
          element={<FloorPlanAnalysisLoadingPage />}
        />
        <Route
          path="/analysis/spaces"
          element={<SpaceInformationPage />}
        />
        <Route
          path="/analysis/style"
          element={<StyleSelectionPage />}
        />
        <Route
          path="/analysis/simulation/photo"
          element={<SimulationPhotoUploadPage />}
        />
        <Route
          path="/analysis/simulation/generating"
          element={<SimulationGeneratingPage />}
        />
        <Route
          path="/analysis/simulation/result"
          element={<SimulationResultPage />}
        />
        <Route
          path="/analysis/new/address"
          element={<ApartmentAddressSearchPage />}
        />
        <Route
          path="/analysis/:id"
          element={<AnalysisResultPage />}
        />

        <Route
          element={
            <EstimateFlowProvider>
              <Outlet />
            </EstimateFlowProvider>
          }
        >
          <Route
            path="/estimate/summary"
            element={<EstimateSummaryPage />}
          />
          <Route
            path="/estimate/materials/floor"
            element={<FloorMaterialSelectionPage />}
          />
          <Route
            path="/estimate/materials/wallpaper"
            element={<WallpaperMaterialSelectionPage />}
          />
          <Route
            path="/estimate/materials/lighting"
            element={<LightingMaterialSelectionPage />}
          />
          <Route
            path="/report/value-increase"
            element={<HomeValueIncreaseReportPage />}
          />
        </Route>

        <Route
          path="/estimate/request/complete"
          element={<EstimateRequestCompletePage />}
        />
        <Route
          path="/estimate/request"
          element={<EstimateRequestPage />}
        />
        <Route
          path="/estimate/:id"
          element={<EstimatePage />}
        />
        <Route
          path="/report/:id"
          element={<ReportPage />}
        />
        <Route
          path="/contractors"
          element={<ContractorPage />}
        />
        <Route
          path="/contractors/:contractorId"
          element={<ContractorDetailPage />}
        />

        <Route
          element={
            <ContractorPortalFlowProvider>
              <Outlet />
            </ContractorPortalFlowProvider>
          }
        >
          <Route
            path="/contractor"
            element={<ContractorDashboardPage />}
          />

          <Route
            path="/contractor/requests"
            element={<ContractorRequestListPage />}
          />
          <Route
            path="/contractor/requests/:requestId/floor-plan"
            element={<ContractorRequestFloorPlanPage />}
          />
          <Route
            path="/contractor/requests/:requestId/photos"
            element={<ContractorRequestPhotosPage />}
          />
          <Route
            path="/contractor/requests/:requestId/analysis"
            element={<ContractorRequestAnalysisPage />}
          />
          <Route
            path="/contractor/requests/:requestId/approved"
            element={<ContractorRequestApprovedPage />}
          />
          <Route
            path="/contractor/requests/:requestId/chat/completed"
            element={<ContractorChatPage completed />}
          />
          <Route
            path="/contractor/requests/:requestId/chat"
            element={<ContractorChatPage />}
          />
          <Route
            path="/contractor/requests/:requestId/visit"
            element={<ContractorVisitPage />}
          />
          <Route
            path="/contractor/requests/:requestId/estimate-ready"
            element={<ContractorEstimateReadyPage />}
          />
          <Route
            path="/contractor/requests/:requestId/estimate/sent"
            element={<ContractorEstimateSentPage />}
          />
          <Route
            path="/contractor/requests/:requestId/estimate/preview"
            element={<ContractorEstimatePreviewPage />}
          />
          <Route
            path="/contractor/requests/:requestId/estimate"
            element={<ContractorEstimateEditPage />}
          />
          <Route
            path="/contractor/requests/:requestId"
            element={<ContractorRequestDetailPage />}
          />

          <Route
            path="/contractor/estimates"
            element={<ContractorEstimateListPage />}
          />
          <Route
            path="/contractor/estimates/:estimateId/contract-ready"
            element={<ContractorContractReadyPage />}
          />
          <Route
            path="/contractor/estimates/:estimateId"
            element={<ContractorEstimateDetailPage />}
          />

          <Route
            path="/contractor/projects"
            element={<ContractorProjectListPage />}
          />
          <Route
            path="/contractor/projects/:projectId"
            element={<ContractorProjectDetailPage />}
          />

          <Route
            path="/contractor/settlements"
            element={<ContractorSettlementListPage />}
          />
          <Route
            path="/contractor/settlements/:settlementId/statement"
            element={<ContractorSettlementStatementPage />}
          />
          <Route
            path="/contractor/settlements/:settlementId/breakdown"
            element={<ContractorSettlementBreakdownPage />}
          />
          <Route
            path="/contractor/settlements/:settlementId"
            element={<ContractorSettlementDetailPage />}
          />

          <Route
            path="/contractor/notifications"
            element={<ContractorNotificationPage />}
          />

          <Route
            path="/contractor/mypage"
            element={<ContractorMyPage />}
          />

          <Route
            path="/contractor/portfolio"
            element={<ContractorPortfolioPage />}
          />

          <Route
            path="/contractor/portfolio/create"
            element={<ContractorPortfolioCreatePage />}
          />

          <Route
            path="/contractor/portfolio/:portfolioId/edit"
            element={<ContractorPortfolioEditPage />}
          />

          <Route
            path="/contractor/settings"
            element={<ContractorSettingsPage />}
          />
          <Route
            path="/contractor/settings/account"
            element={<ContractorAccountSettingsPage />}
          />
          <Route
            path="/contractor/settings/manager"
            element={<ContractorManagerInfoPage />}
          />
          <Route
            path="/contractor/settings/visibility"
            element={<ContractorVisibilitySettingsPage />}
          />
          <Route
            path="/contractor/settings/withdrawal"
            element={<ContractorWithdrawalPage />}
          />
          <Route
            path="/contractor/settings/withdrawal/completed"
            element={<ContractorWithdrawalCompletedPage />}
          />

          <Route
            path="/contractor/company"
            element={<ContractorCompanyInfoPage />}
          />
          <Route
            path="/contractor/company/specialties"
            element={<ContractorCompanySpecialtiesPage />}
          />
          <Route
            path="/contractor/company/regions"
            element={<ContractorCompanyRegionsPage />}
          />
          <Route
            path="/contractor/company/settlement"
            element={<ContractorCompanySettlementPage />}
          />

          <Route
            path="/contractor/reviews"
            element={<ContractorReviewListPage />}
          />
          <Route
            path="/contractor/reviews/:reviewId"
            element={<ContractorReviewDetailPage />}
          />
        </Route>

        <Route
          path="/mypage/requests"
          element={<EstimateRequestHistoryPage />}
        />
        <Route
          path="/mypage/requests/:requestId"
          element={<EstimateRequestDetailPage />}
        />
        <Route
          path="/mypage"
          element={<MyPage />}
        />
        <Route
          path="/notifications"
          element={<NotificationCenterPage />}
        />
        <Route
          path="/settings"
          element={<SettingsPage />}
        />
        <Route
          path="/analysis/new/property"
          element={<PropertyInformationPage />}
        />
      </Routes>
    </BrowserRouter>
  )
}