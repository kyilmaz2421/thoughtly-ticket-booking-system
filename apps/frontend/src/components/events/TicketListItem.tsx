import { Button, List, Tag, Typography } from "antd";

import { Ticket } from "@/services/events";

const { Text } = Typography;

interface Props {
  ticket: Ticket;
  onBook: (ticket: Ticket) => void;
}

export function TicketListItem({ ticket, onBook }: Props) {
  return (
    <List.Item
      actions={[
        <Button
          key="book"
          type="primary"
          size="small"
          onClick={() => onBook(ticket)}
        >
          Book
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Tag>{ticket.section}</Tag>
            <Text>Seat {ticket.seatNumber}</Text>
          </div>
        }
      />
      <Text strong style={{ fontSize: 16 }}>
        {ticket.priceDisplay}
      </Text>
    </List.Item>
  );
}
