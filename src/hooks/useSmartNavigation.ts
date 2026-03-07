import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { loadPatientContext, clearCurrentPatient } from '../store/slices/globalSlice';

export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const goToPatient = async (patientId: string, section?: 'vitals' | 'consultation' | 'prescription' | 'billing') => {
    await dispatch(loadPatientContext(patientId));
    if (section) {
      navigate(`/opd?patient=${patientId}&tab=${section}`);
    } else {
      navigate(`/patients?id=${patientId}`);
    }
  };

  const goToAdmission = (admissionId: string) => {
    navigate(`/ipd?admission=${admissionId}`);
  };

  const startConsultation = async (patientId: string) => {
    await dispatch(loadPatientContext(patientId));
    navigate(`/opd?patient=${patientId}&tab=consultation`);
  };

  const goToBilling = async (patientId: string) => {
    await dispatch(loadPatientContext(patientId));
    navigate(`/billing?patient=${patientId}`);
  };

  const admitPatient = async (patientId: string) => {
    await dispatch(loadPatientContext(patientId));
    navigate(`/ipd?admit=${patientId}`);
  };

  const clearContext = () => {
    dispatch(clearCurrentPatient());
  };

  return {
    goToPatient,
    goToAdmission,
    startConsultation,
    goToBilling,
    admitPatient,
    clearContext,
    navigate,
  };
};
