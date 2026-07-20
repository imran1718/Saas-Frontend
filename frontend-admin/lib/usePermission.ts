import { useAuth } from './authStore';

export const usePermission = (permissionKey: string) => {
  const { user } = useAuth();
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permissionKey);
};
