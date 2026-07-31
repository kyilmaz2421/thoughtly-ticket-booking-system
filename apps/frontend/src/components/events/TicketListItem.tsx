"use client";

import { useEffect, useState } from "react";
import { Button, List, Tag, Typography } from "antd";

import { Ticket } from "@/services/events";

const { Text } = Typography;

function useCountdown(expiresAt?: string) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setSecondsLeft(
        Math.max(
          0,
          Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
        ),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return secondsLeft;
}

interface Props {
  ticket: Ticket;
  onBook: (ticket: Ticket) => void;
  isHeld: boolean;
  isBlocked: boolean;
}

export function TicketListItem({ ticket, onBook, isHeld, isBlocked }: Props) {
  const secondsLeft = useCountdown(isHeld ? ticket.heldUntil : undefined);

  const countdownLabel =
    secondsLeft !== null
      ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
      : null;

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
            {isHeld && (
              <Tag color="orange">
                Ticket Reserved for you
                {countdownLabel ? ` — ${countdownLabel}` : ""}
              </Tag>
            )}
          </div>
        }
      />
      <Text strong style={{ fontSize: 16 }}>
        {ticket.priceDisplay}
      </Text>
    </List.Item>
  );
}
