import { IsString, IsOptional, IsEnum } from "class-validator";
import { Currency } from "@prisma/client";

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}

export class UpdatePreferencesDto {
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  theme?: string;
}
