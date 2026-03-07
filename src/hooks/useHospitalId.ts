import { useAppSelector } from '../store';

const DEMO_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export function useHospitalId(): string {
  const { user } = useAppSelector((state) => state.auth);
  return user?.hospital_id ?? DEMO_HOSPITAL_ID;
}

export function getHospitalIdFromUser(user: { hospital_id?: string | null } | null): string {
  return user?.hospital_id ?? DEMO_HOSPITAL_ID;
}

export { DEMO_HOSPITAL_ID };
