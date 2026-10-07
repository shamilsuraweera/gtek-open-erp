import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles('Admin', 'User')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @Roles('Admin', 'User')
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/password')
  @Roles('Admin', 'User')
  changeOwnPassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changeOwnPassword(req.user.id, dto.CurrentPassword, dto.NewPassword);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto.Email, dto.Password, dto.Role);
  }

  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
    @Request() req,
  ) {
    if (id === req.user.id) {
      throw new BadRequestException('You cannot change your own role');
    }
    return this.usersService.updateRole(id, dto.Role);
  }

  @Patch(':id/password')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto.Password);
  }

  @Delete(':id')
  archive(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (id === req.user.id) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    return this.usersService.archive(id);
  }
}
