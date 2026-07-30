import { BaseDto } from '../../common/dto/base.dto';
import { Venue } from '../entities/venue.entity';

export class VenueSummaryDto extends BaseDto {
  id: string;
  name: string;
  city: string;
  countryCode: string;

  static from(venue: Venue): VenueSummaryDto {
    return {
      id: venue.id,
      name: venue.name,
      city: venue.city,
      countryCode: venue.countryCode,
      createdAt: venue.createdAt.toISOString(),
    };
  }
}

export class VenueDetailDto extends VenueSummaryDto {
  addressLine1: string;
  addressLine2: string;
  stateProvince: string | null;
  postalOrZipCode: string;
  vipCapacity: number;
  frontRowCapacity: number;
  gaCapacity: number;

  static from(venue: Venue): VenueDetailDto {
    return {
      ...VenueSummaryDto.from(venue),
      addressLine1: venue.addressLine1,
      addressLine2: venue.addressLine2,
      stateProvince: venue.stateProvince,
      postalOrZipCode: venue.postalOrZipCode,
      vipCapacity: venue.vipCapacity,
      frontRowCapacity: venue.frontRowCapacity,
      gaCapacity: venue.gaCapacity,
    };
  }
}
