import { MigrationInterface, QueryRunner } from 'typeorm';

import { User } from '../../src/users/entities/user.entity';
import { EventHost } from '../../src/hosts/entities/event-host.entity';
import { Venue } from '../../src/venues/entities/venue.entity';
import { Event, EventType } from '../../src/events/entities/event.entity';
import { Ticket, TicketSection } from '../../src/events/entities/ticket.entity';

const PRICE_CENTS = {
  [TicketSection.VIP]: 10000,
  [TicketSection.FRONT_ROW]: 5000,
  [TicketSection.GA]: 1000,
};

function buildTickets(event: Event, vip: number, fr: number, ga: number): Partial<Ticket>[] {
  const tickets: Partial<Ticket>[] = [];
  const sections: [TicketSection, number][] = [
    [TicketSection.VIP, vip],
    [TicketSection.FRONT_ROW, fr],
    [TicketSection.GA, ga],
  ];
  for (const [section, count] of sections) {
    for (let i = 1; i <= count; i++) {
      tickets.push({ event, eventId: event.id, section, seatNumber: i, priceCents: PRICE_CENTS[section] });
    }
  }
  return tickets;
}

export class SeedEventData1753000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const m = queryRunner.manager;

    // -----------------------------------------------------------------------
    // Users (demo — stand-ins for real auth)
    // -----------------------------------------------------------------------
    await m.save(User, [
      { name: 'Alice Chen',    email: 'alice@example.com'   },
      { name: 'Bob Martinez',  email: 'bob@example.com'     },
      { name: 'Carol Johnson', email: 'carol@example.com'   },
      { name: 'David Kim',     email: 'david@example.com'   },
      { name: 'Eva Williams',  email: 'eva@example.com'     },
    ]);

    // -----------------------------------------------------------------------
    // Venues
    // -----------------------------------------------------------------------
    const [msg, td, barcl, ppg, yankee, citi, metlife, sofi, rr, gersh, minsky, ambass, wk, musicbox] =
      await m.save(Venue, [
        { name: 'Madison Square Garden',   addressLine1: '4 Pennsylvania Plaza',     addressLine2: '', city: 'New York',         stateProvince: 'NY', postalOrZipCode: '10001', countryCode: 'US', vipCapacity: 40,  frontRowCapacity: 160, gaCapacity: 300 },
        { name: 'TD Garden',               addressLine1: '100 Legends Way',           addressLine2: '', city: 'Boston',           stateProvince: 'MA', postalOrZipCode: '02114', countryCode: 'US', vipCapacity: 30,  frontRowCapacity: 120, gaCapacity: 250 },
        { name: 'Barclays Center',         addressLine1: '620 Atlantic Ave',          addressLine2: '', city: 'Brooklyn',         stateProvince: 'NY', postalOrZipCode: '11217', countryCode: 'US', vipCapacity: 40,  frontRowCapacity: 160, gaCapacity: 300 },
        { name: 'PPG Paints Arena',        addressLine1: '1001 Fifth Ave',            addressLine2: '', city: 'Pittsburgh',       stateProvince: 'PA', postalOrZipCode: '15219', countryCode: 'US', vipCapacity: 25,  frontRowCapacity: 100, gaCapacity: 200 },
        { name: 'Yankee Stadium',          addressLine1: '1 E 161st St',              addressLine2: '', city: 'Bronx',            stateProvince: 'NY', postalOrZipCode: '10451', countryCode: 'US', vipCapacity: 50,  frontRowCapacity: 200, gaCapacity: 350 },
        { name: 'Citi Field',              addressLine1: '41 Seaver Way',             addressLine2: '', city: 'Queens',           stateProvince: 'NY', postalOrZipCode: '11368', countryCode: 'US', vipCapacity: 40,  frontRowCapacity: 160, gaCapacity: 300 },
        { name: 'MetLife Stadium',         addressLine1: '1 MetLife Stadium Dr',      addressLine2: '', city: 'East Rutherford', stateProvince: 'NJ', postalOrZipCode: '07073', countryCode: 'US', vipCapacity: 50,  frontRowCapacity: 200, gaCapacity: 350 },
        { name: 'SoFi Stadium',            addressLine1: '1001 Stadium Drive',        addressLine2: '', city: 'Inglewood',        stateProvince: 'CA', postalOrZipCode: '90301', countryCode: 'US', vipCapacity: 50,  frontRowCapacity: 200, gaCapacity: 350 },
        { name: 'Richard Rodgers Theatre', addressLine1: '226 W 46th St',             addressLine2: '', city: 'New York',         stateProvince: 'NY', postalOrZipCode: '10036', countryCode: 'US', vipCapacity: 15,  frontRowCapacity: 45,  gaCapacity: 90  },
        { name: 'Gershwin Theatre',        addressLine1: '222 W 51st St',             addressLine2: '', city: 'New York',         stateProvince: 'NY', postalOrZipCode: '10019', countryCode: 'US', vipCapacity: 15,  frontRowCapacity: 45,  gaCapacity: 90  },
        { name: 'Minskoff Theatre',        addressLine1: '200 W 45th St',             addressLine2: '', city: 'New York',         stateProvince: 'NY', postalOrZipCode: '10036', countryCode: 'US', vipCapacity: 15,  frontRowCapacity: 45,  gaCapacity: 90  },
        { name: 'Ambassador Theatre',      addressLine1: '219 W 49th St',             addressLine2: '', city: 'New York',         stateProvince: 'NY', postalOrZipCode: '10019', countryCode: 'US', vipCapacity: 15,  frontRowCapacity: 45,  gaCapacity: 90  },
        { name: 'Walter Kerr Theatre',     addressLine1: '219 W 48th St',             addressLine2: '', city: 'New York',         stateProvince: 'NY', postalOrZipCode: '10036', countryCode: 'US', vipCapacity: 15,  frontRowCapacity: 45,  gaCapacity: 90  },
        { name: 'Music Box Theatre',       addressLine1: '239 W 45th St',             addressLine2: '', city: 'New York',         stateProvince: 'NY', postalOrZipCode: '10036', countryCode: 'US', vipCapacity: 15,  frontRowCapacity: 45,  gaCapacity: 90  },
      ]);

    // -----------------------------------------------------------------------
    // Hosts
    // -----------------------------------------------------------------------
    const [beyonce, taylor, kendrick, billie, weeknd, badBunny, knicks, celtics, rangers, penguins, yankees, mets, giants, eagles, hamilton, wicked, lionKing, chicago, hadestown, suffs] =
      await m.save(EventHost, [
        { name: 'Beyoncé',                       description: 'Grammy-winning recording artist and global icon' },
        { name: 'Taylor Swift',                  description: 'Multi-platinum recording artist and songwriter' },
        { name: 'Kendrick Lamar',                description: 'Pulitzer Prize-winning rapper and producer' },
        { name: 'Billie Eilish',                 description: 'Grammy-winning singer-songwriter' },
        { name: 'The Weeknd',                    description: 'Multi-platinum R&B and pop artist' },
        { name: 'Bad Bunny',                     description: 'Global Latin trap and reggaeton artist' },
        { name: 'New York Knicks',               description: 'NBA franchise based at Madison Square Garden' },
        { name: 'Boston Celtics',                description: 'NBA franchise based at TD Garden' },
        { name: 'New York Rangers',              description: 'NHL franchise based at Madison Square Garden' },
        { name: 'Pittsburgh Penguins',           description: 'NHL franchise based at PPG Paints Arena' },
        { name: 'New York Yankees',              description: 'MLB franchise based at Yankee Stadium' },
        { name: 'New York Mets',                 description: 'MLB franchise based at Citi Field' },
        { name: 'New York Giants',               description: 'NFL franchise based at MetLife Stadium' },
        { name: 'Philadelphia Eagles',           description: 'NFL franchise based at Lincoln Financial Field' },
        { name: 'Hamilton Productions',          description: 'Original Broadway production of Hamilton' },
        { name: 'Marc Platt Productions',        description: 'Producers of Wicked on Broadway' },
        { name: 'Disney Theatrical Productions', description: 'Producers of The Lion King on Broadway' },
        { name: 'Barry & Fran Weissler',         description: 'Producers of Chicago the Musical' },
        { name: 'Anaïs Mitchell Company',        description: 'Producers of Hadestown on Broadway' },
        { name: 'Jill Furman Productions',       description: 'Producers of Suffs on Broadway' },
      ]);

    // -----------------------------------------------------------------------
    // Events + Tickets
    // -----------------------------------------------------------------------
    type EventSeed = Omit<Partial<Event>, 'venue' | 'eventHost'> & {
      venue: Venue;
      eventHost: EventHost;
      tickets: [number, number, number]; // [vip, fr, ga]
    };

    const eventSeeds: EventSeed[] = [
      // Concerts
      { name: 'Beyoncé: Renaissance World Tour',          description: 'An iconic global stadium tour.',                          startDatetime: new Date('2025-06-01T20:00:00Z'), endDatetime: new Date('2025-06-01T23:00:00Z'), eventType: EventType.CONCERT,  eventHost: beyonce,   venue: msg,      tickets: [40, 160, 300] },
      { name: 'Taylor Swift: The Eras Tour',              description: 'A journey through every musical era.',                    startDatetime: new Date('2025-06-14T19:30:00Z'), endDatetime: new Date('2025-06-14T23:00:00Z'), eventType: EventType.CONCERT,  eventHost: taylor,    venue: sofi,     tickets: [50, 200, 350] },
      { name: 'Kendrick Lamar: GNX Tour',                 description: 'A landmark hip-hop performance.',                         startDatetime: new Date('2025-07-04T20:00:00Z'), endDatetime: new Date('2025-07-04T22:30:00Z'), eventType: EventType.CONCERT,  eventHost: kendrick,  venue: barcl,    tickets: [40, 160, 300] },
      { name: 'Billie Eilish: Hit Me Hard and Soft Tour', description: 'An intimate arena tour.',                                 startDatetime: new Date('2025-07-12T20:00:00Z'), endDatetime: new Date('2025-07-12T22:30:00Z'), eventType: EventType.CONCERT,  eventHost: billie,    venue: msg,      tickets: [40, 160, 300] },
      { name: 'The Weeknd: After Hours Til Dawn',         description: 'A cinematic stadium experience.',                         startDatetime: new Date('2025-08-02T20:00:00Z'), endDatetime: new Date('2025-08-02T23:00:00Z'), eventType: EventType.CONCERT,  eventHost: weeknd,    venue: barcl,    tickets: [40, 160, 300] },
      { name: 'Bad Bunny: Most Wanted Tour',              description: 'The biggest Latin music event of the year.',              startDatetime: new Date('2025-08-16T20:00:00Z'), endDatetime: new Date('2025-08-16T23:00:00Z'), eventType: EventType.CONCERT,  eventHost: badBunny,  venue: msg,      tickets: [40, 160, 300] },
      // Broadway
      { name: 'Hamilton',                                 description: 'The story of America then, told by America now.',         startDatetime: new Date('2025-06-07T19:00:00Z'), endDatetime: new Date('2025-06-07T22:00:00Z'), eventType: EventType.BROADWAY, eventHost: hamilton,  venue: rr,       tickets: [15, 45, 90] },
      { name: 'Wicked',                                   description: 'The untold story of the Witches of Oz.',                  startDatetime: new Date('2025-06-08T14:00:00Z'), endDatetime: new Date('2025-06-08T17:00:00Z'), eventType: EventType.BROADWAY, eventHost: wicked,    venue: gersh,    tickets: [15, 45, 90] },
      { name: 'The Lion King',                            description: "Disney's beloved musical on the Broadway stage.",         startDatetime: new Date('2025-06-21T19:00:00Z'), endDatetime: new Date('2025-06-21T22:00:00Z'), eventType: EventType.BROADWAY, eventHost: lionKing,  venue: minsky,   tickets: [15, 45, 90] },
      { name: 'Chicago',                                  description: 'All that jazz — the longest-running musical.',            startDatetime: new Date('2025-06-28T20:00:00Z'), endDatetime: new Date('2025-06-28T22:30:00Z'), eventType: EventType.BROADWAY, eventHost: chicago,   venue: ambass,   tickets: [15, 45, 90] },
      { name: 'Hadestown',                                description: 'Where a song can change your fate.',                      startDatetime: new Date('2025-07-05T19:00:00Z'), endDatetime: new Date('2025-07-05T22:00:00Z'), eventType: EventType.BROADWAY, eventHost: hadestown, venue: wk,       tickets: [15, 45, 90] },
      { name: 'Suffs',                                    description: 'The women who fought for the right to vote.',             startDatetime: new Date('2025-07-19T14:00:00Z'), endDatetime: new Date('2025-07-19T17:00:00Z'), eventType: EventType.BROADWAY, eventHost: suffs,     venue: musicbox, tickets: [15, 45, 90] },
      // Knicks vs Celtics — NBA Eastern Conference Finals
      { name: 'Knicks vs Celtics — ECF Game 1',          description: 'NBA Eastern Conference Finals.',                          startDatetime: new Date('2025-05-20T23:30:00Z'), endDatetime: new Date('2025-05-21T02:30:00Z'), eventType: EventType.SPORTING, eventHost: knicks,    venue: msg,      tickets: [40, 160, 300] },
      { name: 'Knicks vs Celtics — ECF Game 2',          description: 'NBA Eastern Conference Finals.',                          startDatetime: new Date('2025-05-22T23:30:00Z'), endDatetime: new Date('2025-05-23T02:30:00Z'), eventType: EventType.SPORTING, eventHost: knicks,    venue: msg,      tickets: [40, 160, 300] },
      { name: 'Celtics vs Knicks — ECF Game 3',          description: 'NBA Eastern Conference Finals.',                          startDatetime: new Date('2025-05-24T23:30:00Z'), endDatetime: new Date('2025-05-25T02:30:00Z'), eventType: EventType.SPORTING, eventHost: celtics,   venue: td,       tickets: [30, 120, 250] },
      { name: 'Celtics vs Knicks — ECF Game 4',          description: 'NBA Eastern Conference Finals.',                          startDatetime: new Date('2025-05-26T23:30:00Z'), endDatetime: new Date('2025-05-27T02:30:00Z'), eventType: EventType.SPORTING, eventHost: celtics,   venue: td,       tickets: [30, 120, 250] },
      { name: 'Knicks vs Celtics — ECF Game 5',          description: 'NBA Eastern Conference Finals.',                          startDatetime: new Date('2025-05-28T23:30:00Z'), endDatetime: new Date('2025-05-29T02:30:00Z'), eventType: EventType.SPORTING, eventHost: knicks,    venue: msg,      tickets: [40, 160, 300] },
      { name: 'Celtics vs Knicks — ECF Game 6',          description: 'NBA Eastern Conference Finals.',                          startDatetime: new Date('2025-05-30T23:30:00Z'), endDatetime: new Date('2025-05-31T02:30:00Z'), eventType: EventType.SPORTING, eventHost: celtics,   venue: td,       tickets: [30, 120, 250] },
      { name: 'Knicks vs Celtics — ECF Game 7',          description: 'NBA Eastern Conference Finals — decisive game.',          startDatetime: new Date('2025-06-01T23:30:00Z'), endDatetime: new Date('2025-06-02T02:30:00Z'), eventType: EventType.SPORTING, eventHost: knicks,    venue: msg,      tickets: [40, 160, 300] },
      // Rangers vs Penguins — NHL Playoffs
      { name: 'Rangers vs Penguins — Playoffs Game 1',   description: 'NHL Stanley Cup Playoffs.',                               startDatetime: new Date('2025-04-20T22:00:00Z'), endDatetime: new Date('2025-04-21T01:00:00Z'), eventType: EventType.SPORTING, eventHost: rangers,   venue: msg,      tickets: [40, 160, 300] },
      { name: 'Rangers vs Penguins — Playoffs Game 2',   description: 'NHL Stanley Cup Playoffs.',                               startDatetime: new Date('2025-04-22T22:00:00Z'), endDatetime: new Date('2025-04-23T01:00:00Z'), eventType: EventType.SPORTING, eventHost: rangers,   venue: msg,      tickets: [40, 160, 300] },
      { name: 'Penguins vs Rangers — Playoffs Game 3',   description: 'NHL Stanley Cup Playoffs.',                               startDatetime: new Date('2025-04-24T22:00:00Z'), endDatetime: new Date('2025-04-25T01:00:00Z'), eventType: EventType.SPORTING, eventHost: penguins,  venue: ppg,      tickets: [25, 100, 200] },
      { name: 'Penguins vs Rangers — Playoffs Game 4',   description: 'NHL Stanley Cup Playoffs.',                               startDatetime: new Date('2025-04-26T22:00:00Z'), endDatetime: new Date('2025-04-27T01:00:00Z'), eventType: EventType.SPORTING, eventHost: penguins,  venue: ppg,      tickets: [25, 100, 200] },
      { name: 'Rangers vs Penguins — Playoffs Game 5',   description: 'NHL Stanley Cup Playoffs.',                               startDatetime: new Date('2025-04-28T22:00:00Z'), endDatetime: new Date('2025-04-29T01:00:00Z'), eventType: EventType.SPORTING, eventHost: rangers,   venue: msg,      tickets: [40, 160, 300] },
      { name: 'Penguins vs Rangers — Playoffs Game 6',   description: 'NHL Stanley Cup Playoffs.',                               startDatetime: new Date('2025-04-30T22:00:00Z'), endDatetime: new Date('2025-05-01T01:00:00Z'), eventType: EventType.SPORTING, eventHost: penguins,  venue: ppg,      tickets: [25, 100, 200] },
      { name: 'Rangers vs Penguins — Playoffs Game 7',   description: 'NHL Stanley Cup Playoffs — decisive game.',               startDatetime: new Date('2025-05-02T22:00:00Z'), endDatetime: new Date('2025-05-03T01:00:00Z'), eventType: EventType.SPORTING, eventHost: rangers,   venue: msg,      tickets: [40, 160, 300] },
      // Other sporting events
      { name: 'Yankees vs Red Sox',                      description: 'Classic AL East rivalry — regular season.',               startDatetime: new Date('2025-07-04T22:05:00Z'), endDatetime: new Date('2025-07-05T01:30:00Z'), eventType: EventType.SPORTING, eventHost: yankees,   venue: yankee,   tickets: [50, 200, 350] },
      { name: 'Yankees vs Red Sox Game 2',               description: 'Classic AL East rivalry — regular season.',               startDatetime: new Date('2025-07-05T17:05:00Z'), endDatetime: new Date('2025-07-05T20:30:00Z'), eventType: EventType.SPORTING, eventHost: yankees,   venue: yankee,   tickets: [50, 200, 350] },
      { name: 'Mets vs Dodgers',                         description: 'NL showdown at Citi Field.',                             startDatetime: new Date('2025-08-08T23:10:00Z'), endDatetime: new Date('2025-08-09T02:30:00Z'), eventType: EventType.SPORTING, eventHost: mets,      venue: citi,     tickets: [40, 160, 300] },
      { name: 'Giants vs Eagles — Thursday Night Football', description: 'NFC East rivalry to open the season.',                startDatetime: new Date('2025-09-04T00:20:00Z'), endDatetime: new Date('2025-09-04T03:30:00Z'), eventType: EventType.SPORTING, eventHost: giants,    venue: metlife,  tickets: [50, 200, 350] },
    ];

    for (const { tickets: [vip, fr, ga], ...eventData } of eventSeeds) {
      const event = await m.save(Event, eventData);
      const ticketEntities = buildTickets(event, vip, fr, ga);
      // Insert in chunks to avoid hitting postgres parameter limits
      const chunkSize = 500;
      for (let i = 0; i < ticketEntities.length; i += chunkSize) {
        await m.save(Ticket, ticketEntities.slice(i, i + chunkSize));
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM ticket;`);
    await queryRunner.query(`DELETE FROM event;`);
    await queryRunner.query(`DELETE FROM event_host;`);
    await queryRunner.query(`DELETE FROM venue;`);
    await queryRunner.query(`DELETE FROM "user";`);
  }
}
