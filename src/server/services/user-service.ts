import { auth } from '@/server/lib/auth';
import { ApiError } from '@/server/lib/errors';
import { userRepository } from '@/server/repositories/user-repository';
import type { CreateUserInput } from '@/validations/user-schema';

// Site users are entirely admin-provisioned — there is no public sign-up. Creation goes
// through Better Auth's own server API so password hashing/account linking stays exactly
// consistent with what sign-in later verifies against.
export const userService = {
  list() {
    return userRepository.list();
  },

  async create(data: CreateUserInput) {
    const existing = await userRepository.byEmail(data.email);
    if (existing) throw ApiError.conflict('A user with this email already exists');

    const result = await auth.api.signUpEmail({
      body: { email: data.email, password: data.password, name: data.name },
    });
    return result.user;
  },
};
