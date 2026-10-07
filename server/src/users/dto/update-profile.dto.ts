import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  DisplayName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  Email?: string;
}
