import { User } from '../user.entity';

export type SafeUser = Omit<User, 'PasswordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { PasswordHash, ...safe } = user;
  return safe;
}
