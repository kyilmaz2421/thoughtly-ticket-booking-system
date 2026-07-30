import { BaseDto } from '../../common/dto/base.dto';

export class VenueSummaryDto extends BaseDto {
  id: string;
  name: string;
  city: string;
  countryCode: string;
}

export class VenueDetailDto extends VenueSummaryDto {
  addressLine1: string;
  addressLine2: string;
  stateProvince: string | null;
  postalOrZipCode: string;
  vipCapacity: number;
  frontRowCapacity: number;
  gaCapacity: number;
}
