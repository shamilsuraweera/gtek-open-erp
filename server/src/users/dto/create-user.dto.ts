import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { USER_ROLES } from '../user-roles';

export class CreateUserDto {
  @IsEmail()
  Email: string;

  @IsString()
  @MinLength(8)
  Password: string;

  @IsIn(USER_ROLES)
  Role: string;
}
