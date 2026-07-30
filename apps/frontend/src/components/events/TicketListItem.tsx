import { Button, List, Tag, Typography } from "antd";

import { Ticket } from "@/services/events";

const { Text } = Typography;

interface Props {
  ticket: Ticket;
  onBook: (ticket: Ticket) => void;
  isHeld: boolean; // this ticket is held by the current user
  isBlocked: boolean; // another ticket is held — this one is unclickable
}

export function TicketListItem({ ticket, onBook, isHeld, isBlocked }: Props) {
  return (
    <List.Item
      actions={[
        <Button
          key="book"
          type={isHeld ? "default" : "primary"}
          size="small"
          disabled={isBlocked}
          onClick={() => onBook(ticket)}
        >
          {isHeld ? "Resume" : "Book"}
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Tag>{ticket.section}</Tag>
            <Text>Seat {ticket.seatNumber}</Text>
            {isHeld && <Tag color="orange">Ticket is On Hold for you</Tag>}
          </div>
        }
      />
      <Text strong style={{ fontSize: 16 }}>
        {ticket.priceDisplay}
      </Text>
    </List.Item>
  );
}
