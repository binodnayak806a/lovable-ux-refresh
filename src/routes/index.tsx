import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LoginPage from '../modules/auth/LoginPage';
import RegisterPage from '../modules/auth/RegisterPage';
import ForgotPasswordPage from '../modules/auth/ForgotPasswordPage';
import ResetPasswordPage from '../modules/auth/ResetPasswordPage';

const DashboardPage = lazy(() => import('../modules/dashboard/DashboardPage'));
const PatientsPage = lazy(() => import('../modules/patients/PatientsPage'));
const AddPatientPage = lazy(() => import('../modules/patients/AddPatientPage'));
const EditPatientPage = lazy(() => import('../modules/patients/EditPatientPage'));
const OPDPage = lazy(() => import('../modules/opd/OPDPage'));
const IPDPage = lazy(() => import('../modules/ipd/IPDPage'));
const PharmacyPage = lazy(() => import('../modules/pharmacy/PharmacyPage'));
const LabPage = lazy(() => import('../modules/lab/LabPage'));
const ReportsPage = lazy(() => import('../modules/reports/ReportsPage'));
const AnalyticsPage = lazy(() => import('../modules/analytics/AnalyticsPage'));
const AmbulancePage = lazy(() => import('../modules/ambulance/AmbulancePage'));
const EmergencyPage = lazy(() => import('../modules/emergency/EmergencyPage'));
const HRMSPage = lazy(() => import('../modules/hrms/HRMSPage'));
const SettingsPageReal = lazy(() => import('../modules/settings/SettingsPage'));
const AdminPage = lazy(() => import('../modules/admin/AdminPage'));
const MasterDataPage = lazy(() => import('../modules/master-data/MasterDataPage'));
const BedMasterPage = lazy(() => import('../modules/ipd/BedMasterPage'));

const MastersLayout = lazy(() => import('../modules/masters/MastersLayout'));
const DoctorMasterPage = lazy(() => import('../modules/masters/pages/DoctorMasterPage'));
const DepartmentMasterPage = lazy(() => import('../modules/masters/pages/DepartmentMasterPage'));
const ServiceMasterPage = lazy(() => import('../modules/masters/pages/ServiceMasterPage'));
const PackageMasterPage = lazy(() => import('../modules/masters/pages/PackageMasterPage'));
const MedicineMasterPage = lazy(() => import('../modules/masters/pages/MedicineMasterPage'));
const SymptomMasterPage = lazy(() => import('../modules/masters/pages/SymptomMasterPage'));
const LabTestMasterPage = lazy(() => import('../modules/masters/pages/LabTestMasterPage'));
const CustomFieldsConfigPage = lazy(() => import('../modules/masters/pages/CustomFieldsConfigPage'));
const UserRoleMasterPage = lazy(() => import('../modules/masters/pages/UserRoleMasterPage'));
const GstConfigPage = lazy(() => import('../modules/masters/pages/GstConfigPage'));
const VisitTypesPage = lazy(() => import('../modules/masters/pages/VisitTypesPage'));
const PrintTemplatesPage = lazy(() => import('../modules/masters/pages/print-templates/PrintTemplatesPage'));
const QRCodePage = lazy(() => import('../modules/masters/pages/QRCodePage'));
const QRBookingPage = lazy(() => import('../modules/qr-booking/QRBookingPage'));

const stub = (name: string) =>
  lazy(() => import('../modules/stubs').then((m) => ({ default: (m as Record<string, React.ComponentType>)[name] })));

const AppointmentsPage = lazy(() => import('../modules/appointments/AppointmentsPage'));
const DoctorQueuePage = lazy(() => import('../modules/doctor-queue/DoctorQueuePage'));
const OperationTheatrePage = stub('OperationTheatrePage');
const ICUPage = stub('ICUPage');
const WardPage = stub('WardPage');
const NursingPage = stub('NursingPage');
const DischargePage = stub('DischargePage');
const RadiologyPage = stub('RadiologyPage');
const PathologyPage = stub('PathologyPage');
const BloodBankPage = stub('BloodBankPage');
const BillingPage = lazy(() => import('../modules/billing/BillingPage'));
const InsurancePage = stub('InsurancePage');
const TPAPage = stub('TPAPage');
const AccountsPage = stub('AccountsPage');
const InventoryPage = stub('InventoryPage');
const PurchasePage = stub('PurchasePage');
const StorePage = stub('StorePage');
const AssetsPage = stub('AssetsPage');
const DieteticsPage = stub('DieteticsPage');
const PhysiotherapyPage = stub('PhysiotherapyPage');
const LaundryPage = stub('LaundryPage');
const CSSDPage = stub('CSSDPage');
const MortuaryPage = stub('MortuaryPage');
const QueuePage = stub('QueuePage');
const TelemedicinePage = stub('TelemedicinePage');
const DoctorsPage = stub('DoctorsPage');
const PayrollPage = stub('PayrollPage');
const HousekeepingPage = stub('HousekeepingPage');
const CanteenPage = stub('CanteenPage');
const VisitorsPage = stub('VisitorsPage');
const HelpdeskPage = stub('HelpdeskPage');
const PatientPortalPage = stub('PatientPortalPage');
const NABHPage = stub('NABHPage');
const NotificationsPage = lazy(() => import('../modules/notifications/NotificationsPage'));
const StaffPortalPage = stub('StaffPortalPage');
const ProfilePage = lazy(() => import('../modules/profile/ProfilePage'));
const CashBankPage = lazy(() => import('../modules/cash-bank/CashBankPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const S = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/qr-booking/:hospitalId', element: <S><QRBookingPage /></S> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <S><DashboardPage /></S> },
          { path: '/patients', element: <S><PatientsPage /></S> },
          { path: '/add-patient', element: <S><AddPatientPage /></S> },
          { path: '/edit-patient', element: <S><EditPatientPage /></S> },
          { path: '/appointments', element: <S><AppointmentsPage /></S> },
          { path: '/doctor/queue', element: <S><DoctorQueuePage /></S> },
          { path: '/opd', element: <S><OPDPage /></S> },
          { path: '/opd/register', element: <S><OPDPage /></S> },
          { path: '/ipd', element: <S><IPDPage /></S> },
          { path: '/emergency', element: <S><EmergencyPage /></S> },
          { path: '/operation-theatre', element: <S><OperationTheatrePage /></S> },
          { path: '/icu', element: <S><ICUPage /></S> },
          { path: '/ward', element: <S><WardPage /></S> },
          { path: '/nursing', element: <S><NursingPage /></S> },
          { path: '/discharge', element: <S><DischargePage /></S> },
          { path: '/pharmacy', element: <S><PharmacyPage /></S> },
          { path: '/lab', element: <S><LabPage /></S> },
          { path: '/radiology', element: <S><RadiologyPage /></S> },
          { path: '/pathology', element: <S><PathologyPage /></S> },
          { path: '/blood-bank', element: <S><BloodBankPage /></S> },
          { path: '/billing', element: <S><BillingPage /></S> },
          { path: '/cash-bank', element: <S><CashBankPage /></S> },
          { path: '/insurance', element: <S><InsurancePage /></S> },
          { path: '/tpa', element: <S><TPAPage /></S> },
          { path: '/accounts', element: <S><AccountsPage /></S> },
          { path: '/inventory', element: <S><InventoryPage /></S> },
          { path: '/purchase', element: <S><PurchasePage /></S> },
          { path: '/store', element: <S><StorePage /></S> },
          { path: '/assets', element: <S><AssetsPage /></S> },
          { path: '/dietetics', element: <S><DieteticsPage /></S> },
          { path: '/physiotherapy', element: <S><PhysiotherapyPage /></S> },
          { path: '/laundry', element: <S><LaundryPage /></S> },
          { path: '/cssd', element: <S><CSSDPage /></S> },
          { path: '/mortuary', element: <S><MortuaryPage /></S> },
          { path: '/ambulance', element: <S><AmbulancePage /></S> },
          { path: '/queue', element: <S><QueuePage /></S> },
          { path: '/telemedicine', element: <S><TelemedicinePage /></S> },
          { path: '/doctors', element: <S><DoctorsPage /></S> },
          { path: '/hrms', element: <S><HRMSPage /></S> },
          { path: '/payroll', element: <S><PayrollPage /></S> },
          { path: '/housekeeping', element: <S><HousekeepingPage /></S> },
          { path: '/canteen', element: <S><CanteenPage /></S> },
          { path: '/visitors', element: <S><VisitorsPage /></S> },
          { path: '/helpdesk', element: <S><HelpdeskPage /></S> },
          { path: '/patient-portal', element: <S><PatientPortalPage /></S> },
          { path: '/analytics', element: <S><AnalyticsPage /></S> },
          { path: '/nabh', element: <S><NABHPage /></S> },
          { path: '/notifications', element: <S><NotificationsPage /></S> },
          { path: '/audit', element: <S><AdminPage /></S> },
          { path: '/settings', element: <S><SettingsPageReal /></S> },
          { path: '/admin', element: <S><AdminPage /></S> },
          { path: '/master-data', element: <S><MasterDataPage /></S> },
          {
            path: '/master',
            element: <S><MastersLayout /></S>,
            children: [
              { index: true, element: null },
              { path: 'doctors', element: <S><DoctorMasterPage /></S> },
              { path: 'departments', element: <S><DepartmentMasterPage /></S> },
              { path: 'rooms', element: <S><BedMasterPage /></S> },
              { path: 'beds', element: <S><BedMasterPage /></S> },
              { path: 'services', element: <S><ServiceMasterPage /></S> },
              { path: 'packages', element: <S><PackageMasterPage /></S> },
              { path: 'medicines', element: <S><MedicineMasterPage /></S> },
              { path: 'symptoms', element: <S><SymptomMasterPage /></S> },
              { path: 'lab-tests', element: <S><LabTestMasterPage /></S> },
              { path: 'custom-fields', element: <S><CustomFieldsConfigPage /></S> },
              { path: 'users', element: <S><UserRoleMasterPage /></S> },
              { path: 'gst', element: <S><GstConfigPage /></S> },
              { path: 'visit-types', element: <S><VisitTypesPage /></S> },
              { path: 'print-templates', element: <S><PrintTemplatesPage /></S> },
              { path: 'qr-code', element: <S><QRCodePage /></S> },
            ],
          },
          { path: '/reports', element: <S><ReportsPage /></S> },
          { path: '/staff-portal', element: <S><StaffPortalPage /></S> },
          { path: '/profile', element: <S><ProfilePage /></S> },
        ],
      },
    ],
  },
  { path: '*', element: <S><NotFoundPage /></S> },
]);
