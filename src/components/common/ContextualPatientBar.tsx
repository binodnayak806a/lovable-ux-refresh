import { X, User, Stethoscope, Receipt, BedDouble, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { clearCurrentPatient } from '../../store/slices/globalSlice';

export default function ContextualPatientBar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPatient, currentAdmission } = useAppSelector((s) => s.global);

  if (!currentPatient) return null;

  const initials = currentPatient.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const actions = [
    {
      icon: User,
      label: 'View Profile',
      onClick: () => navigate(`/patients?id=${currentPatient.id}`),
    },
    {
      icon: Stethoscope,
      label: 'Consult',
      onClick: () => navigate(`/opd?patient=${currentPatient.id}&tab=consultation`),
    },
    {
      icon: Receipt,
      label: 'Bill',
      onClick: () => navigate(`/billing?patient=${currentPatient.id}`),
    },
    ...(currentAdmission
      ? [
          {
            icon: BedDouble,
            label: 'Admission',
            onClick: () => navigate(`/ipd?admission=${currentAdmission.id}`),
          },
        ]
      : []),
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-gray-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block min-w-0 max-w-[160px]">
          <p className="text-xs font-semibold truncate">{currentPatient.full_name}</p>
          <p className="text-[10px] text-gray-400">{currentPatient.uhid}</p>
        </div>
        <div className="w-px h-5 bg-gray-700 hidden sm:block" />
        <div className="flex items-center gap-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-gray-300" />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => dispatch(clearCurrentPatient())}
          className="ml-1 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export { ArrowRight };
