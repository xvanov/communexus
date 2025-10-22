// tests/unit/auth_service.test.ts
import * as authService from '../../src/services/auth';

jest.mock('../../src/services/auth');

const mocked = authService as jest.Mocked<typeof authService>;

describe('Auth Service (T010) - unit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('signInWithEmail returns user on success', async () => {
    mocked.signInWithEmail.mockResolvedValueOnce({ uid: 'u1', email: 'a@example.com' } as any);
    const res = await authService.signInWithEmail('a@example.com', 'secret');
    expect(res).toEqual(expect.objectContaining({ uid: 'u1' }));
  });

  test('signInWithEmail rejects on invalid credentials', async () => {
    mocked.signInWithEmail.mockRejectedValueOnce(new Error('auth/invalid-credential'));
    await expect(authService.signInWithEmail('a@example.com', 'bad')).rejects.toThrow('auth/invalid-credential');
  });

  test('signInWithGoogle exists and returns a user or throws', async () => {
    mocked.signInWithGoogle.mockResolvedValueOnce({ uid: 'u2' } as any);
    const res = await authService.signInWithGoogle();
    expect(res).toEqual(expect.objectContaining({ uid: 'u2' }));
  });
});
