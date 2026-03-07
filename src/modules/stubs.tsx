import {
  Scissors, HeartPulse,
  Building2, Thermometer, LogOut, Scan, Microscope,
  Droplets, ShieldCheck, FileText, BookOpen, Package, ShoppingCart,
  Warehouse, Computer, Salad, Activity, Sparkles, Moon,
  ListOrdered, Video, UserCog, Banknote, Brush, UtensilsCrossed,
  Contact, Headphones, MonitorSmartphone, BadgeCheck,
  IdCard, WashingMachine,
} from 'lucide-react';
import ModulePlaceholder from '../components/common/ModulePlaceholder';

export function OperationTheatrePage() {
  return <ModulePlaceholder moduleName="Operation Theatre" description="OT scheduling, surgical team management, and OT records." icon={Scissors} />;
}
export function ICUPage() {
  return <ModulePlaceholder moduleName="ICU Management" description="Intensive care unit monitoring and patient management." icon={HeartPulse} />;
}
export function WardPage() {
  return <ModulePlaceholder moduleName="Ward Management" description="Ward beds, nursing stations, and patient round management." icon={Building2} />;
}
export function NursingPage() {
  return <ModulePlaceholder moduleName="Nursing" description="Nursing schedules, duty rosters, and patient care records." icon={Thermometer} />;
}
export function DischargePage() {
  return <ModulePlaceholder moduleName="Discharge" description="Patient discharge processing, summary generation, and billing clearance." icon={LogOut} />;
}
export function RadiologyPage() {
  return <ModulePlaceholder moduleName="Radiology" description="Radiology requests, imaging, and report management." icon={Scan} />;
}
export function PathologyPage() {
  return <ModulePlaceholder moduleName="Pathology" description="Pathology lab management and specimen tracking." icon={Microscope} />;
}
export function BloodBankPage() {
  return <ModulePlaceholder moduleName="Blood Bank" description="Blood inventory, donor management, and cross-matching." icon={Droplets} />;
}
export function InsurancePage() {
  return <ModulePlaceholder moduleName="Insurance" description="Insurance claim processing and policy management." icon={ShieldCheck} />;
}
export function TPAPage() {
  return <ModulePlaceholder moduleName="TPA Management" description="Third Party Administrator management and claims." icon={FileText} />;
}
export function AccountsPage() {
  return <ModulePlaceholder moduleName="Accounts" description="General accounts, ledgers, and financial statements." icon={BookOpen} />;
}
export function InventoryPage() {
  return <ModulePlaceholder moduleName="Inventory" description="Medical supplies, equipment, and consumables tracking." icon={Package} />;
}
export function PurchasePage() {
  return <ModulePlaceholder moduleName="Purchase" description="Purchase orders, vendor management, and procurement." icon={ShoppingCart} />;
}
export function StorePage() {
  return <ModulePlaceholder moduleName="Store Management" description="Central store management and stock movement." icon={Warehouse} />;
}
export function AssetsPage() {
  return <ModulePlaceholder moduleName="Asset Management" description="Hospital equipment and asset lifecycle management." icon={Computer} />;
}
export function DieteticsPage() {
  return <ModulePlaceholder moduleName="Dietetics" description="Patient diet plans and nutritional management." icon={Salad} />;
}
export function PhysiotherapyPage() {
  return <ModulePlaceholder moduleName="Physiotherapy" description="Physiotherapy appointments and treatment plans." icon={Activity} />;
}
export function LaundryPage() {
  return <ModulePlaceholder moduleName="Laundry" description="Hospital linen and laundry management." icon={WashingMachine} />;
}
export function CSSDPage() {
  return <ModulePlaceholder moduleName="CSSD" description="Central Sterile Supply Department management." icon={Sparkles} />;
}
export function MortuaryPage() {
  return <ModulePlaceholder moduleName="Mortuary" description="Mortuary management and death certificate processing." icon={Moon} />;
}
export function QueuePage() {
  return <ModulePlaceholder moduleName="Queue Management" description="Patient queue management and token system." icon={ListOrdered} />;
}
export function TelemedicinePage() {
  return <ModulePlaceholder moduleName="Telemedicine" description="Video consultations and remote patient management." icon={Video} />;
}
export function DoctorsPage() {
  return <ModulePlaceholder moduleName="Doctor Management" description="Doctor profiles, schedules, and performance tracking." icon={UserCog} />;
}
export function PayrollPage() {
  return <ModulePlaceholder moduleName="Payroll" description="Salary processing, deductions, and payslip management." icon={Banknote} />;
}
export function HousekeepingPage() {
  return <ModulePlaceholder moduleName="Housekeeping" description="Housekeeping schedules, tasks, and cleanliness tracking." icon={Brush} />;
}
export function CanteenPage() {
  return <ModulePlaceholder moduleName="Canteen" description="Canteen menu, order management, and billing." icon={UtensilsCrossed} />;
}
export function VisitorsPage() {
  return <ModulePlaceholder moduleName="Visitors" description="Visitor pass management and tracking." icon={Contact} />;
}
export function HelpdeskPage() {
  return <ModulePlaceholder moduleName="Help Desk" description="Patient and staff complaint and query management." icon={Headphones} />;
}
export function PatientPortalPage() {
  return <ModulePlaceholder moduleName="Patient Portal" description="Patient self-service portal for records, appointments, and bills." icon={MonitorSmartphone} />;
}
export function NABHPage() {
  return <ModulePlaceholder moduleName="NABH Compliance" description="NABH accreditation tracking and compliance management." icon={BadgeCheck} />;
}
export function StaffPortalPage() {
  return <ModulePlaceholder moduleName="Staff Portal" description="Staff self-service for leave, payslips, and announcements." icon={IdCard} />;
}
