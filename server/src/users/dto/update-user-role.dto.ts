import { IsIn } from 'class-validator';
import { USER_ROLES } from '../user-roles';

export class UpdateUserRoleDto {
  @IsIn(USER_ROLES)
  Role: string;
}
