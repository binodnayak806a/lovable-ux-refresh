import { useAppDispatch } from '../../store';
import { openModal } from '../../store/slices/uiSlice';

interface PatientNameLinkProps {
  patientId: string;
  name: string;
  className?: string;
}

export default function PatientNameLink({ patientId, name, className }: PatientNameLinkProps) {
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        dispatch(openModal({ key: 'patientHistory', data: patientId }));
      }}
      className={className ?? 'text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left'}
    >
      {name}
    </button>
  );
}
