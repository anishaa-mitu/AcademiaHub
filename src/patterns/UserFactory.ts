import { UserRole, Profile } from '../types';

// Factory Pattern - creates user objects based on role
interface UserBehavior {
  role: UserRole;
  canUploadMaterial: boolean;
  canOfferTutoring: boolean;
  canApproveContent: boolean;
  canManageUsers: boolean;
  dashboardRoute: string;
}

class StudentUser implements UserBehavior {
  role: UserRole = 'student';
  canUploadMaterial = true;
  canOfferTutoring = false;
  canApproveContent = false;
  canManageUsers = false;
  dashboardRoute = '/dashboard';
}

class TutorUser implements UserBehavior {
  role: UserRole = 'tutor';
  canUploadMaterial = true;
  canOfferTutoring = true;
  canApproveContent = false;
  canManageUsers = false;
  dashboardRoute = '/dashboard';
}

class AdminUser implements UserBehavior {
  role: UserRole = 'admin';
  canUploadMaterial = true;
  canOfferTutoring = true;
  canApproveContent = true;
  canManageUsers = true;
  dashboardRoute = '/admin';
}

export class UserFactory {
  static create(role: UserRole): UserBehavior {
    switch (role) {
      case 'tutor': return new TutorUser();
      case 'admin': return new AdminUser();
      default: return new StudentUser();
    }
  }

  static getPermissions(profile: Profile | null): UserBehavior {
    if (!profile) return new StudentUser();
    return UserFactory.create(profile.role);
  }
}
