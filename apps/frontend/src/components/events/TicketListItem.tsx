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
  tickets: Ticket[];
  onBook: (tickets: Ticket[]) => void;
  isHeld: boolean;
  isBlocked: boolean;
}

export function TicketListItem({ tickets, onBook, isHeld, isBlocked }: Props) {
  const heldUntil = tickets.find((t) => t.heldUntil)?.heldUntil;
  const secondsLeft = useCountdown(isHeld ? heldUntil : undefined);

  const countdownLabel =
    secondsLeft !== null
      ? `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`
      : null;

  const first = tickets[0];
  const last = tickets[tickets.length - 1];
  const isMulti = tickets.length > 1;

  const seatLabel = isMulti
    ? `Seats ${first.seatNumber}–${last.seatNumber}`
    : `Seat ${first.seatNumber}`;

  const totalPriceCents = tickets.reduce((sum, t) => sum + t.priceCents, 0);
  const totalPriceDisplay = `$${(totalPriceCents / 100).toFixed(2)}`;
  const priceLabel = isMulti
    ? `${first.priceDisplay} each · ${totalPriceDisplay} total`
    : first.priceDisplay;

  return (
    <List.Item
      actions={[
        <Button
          key="book"
          type={isHeld ? "default" : "primary"}
          size="small"
          disabled={isBlocked}
          onClick={() => onBook(tickets)}
        >
          {isHeld ? "Resume" : "Book"}
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Tag>{first.section}</Tag>
            <Text>{seatLabel}</Text>
            {isHeld && (
              <Tag color="orange">
                Reserved for you
                {countdownLabel ? ` — ${countdownLabel}` : ""}
              </Tag>
            )}
          </div>
        }
      />
      <Text strong style={{ fontSize: 16 }}>
        {priceLabel}
      </Text>
    </List.Item>
  );
}
