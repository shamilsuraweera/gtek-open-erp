import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  CurrentPassword: string;

  @IsString()
  @MinLength(8)
  NewPassword: string;
}
