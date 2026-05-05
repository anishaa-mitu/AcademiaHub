import { describe, it, expect } from 'vitest';
import { UserFactory } from '../patterns/UserFactory';

describe('UserFactory (Factory Pattern)', () => {
  it('creates a StudentUser with correct permissions', () => {
    const user = UserFactory.create('student');
    expect(user.role).toBe('student');
    expect(user.canUploadMaterial).toBe(true);
    expect(user.canOfferTutoring).toBe(false);
    expect(user.canApproveContent).toBe(false);
    expect(user.canManageUsers).toBe(false);
  });

  it('creates a TutorUser with correct permissions', () => {
    const user = UserFactory.create('tutor');
    expect(user.role).toBe('tutor');
    expect(user.canUploadMaterial).toBe(true);
    expect(user.canOfferTutoring).toBe(true);
    expect(user.canApproveContent).toBe(false);
    expect(user.canManageUsers).toBe(false);
  });

  it('creates an AdminUser with full permissions', () => {
    const user = UserFactory.create('admin');
    expect(user.role).toBe('admin');
    expect(user.canUploadMaterial).toBe(true);
    expect(user.canOfferTutoring).toBe(true);
    expect(user.canApproveContent).toBe(true);
    expect(user.canManageUsers).toBe(true);
  });

  it('returns StudentUser by default when profile is null', () => {
    const perms = UserFactory.getPermissions(null);
    expect(perms.role).toBe('student');
  });

  it('returns correct permissions based on profile role', () => {
    const fakeProfile = {
      id: 'abc',
      full_name: 'Test',
      email: 'test@test.com',
      role: 'tutor' as const,
      bio: '',
      expertise: [],
      whatsapp_number: '',
      avatar_url: '',
      is_active: true,
      created_at: '',
      updated_at: '',
    };
    const perms = UserFactory.getPermissions(fakeProfile);
    expect(perms.role).toBe('tutor');
    expect(perms.canOfferTutoring).toBe(true);
  });
});
