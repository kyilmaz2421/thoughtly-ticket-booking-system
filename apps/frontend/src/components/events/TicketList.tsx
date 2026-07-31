"use client";

import { useState } from "react";
import { Button, List, Select, Segmented, Spin } from "antd";

import { useTickets } from "@/hooks/useTickets";
import { Ticket } from "@/services/events";
import { TicketListItem } from "./TicketListItem";

const SECTIONS = ["All", "VIP", "Front Row", "GA"];
const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  value: n,
  label: `${n} ticket${n > 1 ? "s" : ""}`,
}));

// Group tickets by groupId — each group is what the user books together.
function groupTickets(tickets: Ticket[]): Ticket[][] {
  const map = new Map<number, Ticket[]>();
  for (const ticket of tickets) {
    const group = map.get(ticket.groupId) ?? [];
    group.push(ticket);
    map.set(ticket.groupId, group);
  }
  return Array.from(map.values());
}

interface Props {
  eventId: string;
  onBook: (tickets: Ticket[]) => void;
  heldTicketIds: string[];
  userId?: string;
}

export function TicketList({ eventId, onBook, heldTicketIds, userId }: Props) {
  const [section, setSection] = useState("All");
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const { data: ticketsData, isLoading } = useTickets(
    eventId,
    section === "All" ? undefined : section,
    cursor,
    undefined,
    userId,
    quantity,
  );

  const groups = groupTickets(ticketsData?.data ?? []);
  const anyHeld =
    heldTicketIds.length > 0 ||
    (ticketsData?.data ?? []).some((t) => t.heldByMe);

  function nextPage() {
    if (!ticketsData?.nextCursor) return;
    setCursorStack((s) => [...s, cursor ?? ""]);
    setCursor(ticketsData.nextCursor);
  }

  function prevPage() {
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCursor(prev === "" ? undefined : prev);
  }

  function onSectionChange(value: string) {
    setSection(value);
    setCursor(undefined);
    setCursorStack([]);
  }

  function onQuantityChange(value: number) {
    setQuantity(value);
    setCursor(undefined);
    setCursorStack([]);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Segmented
          options={SECTIONS}
          value={section}
          onChange={(v: string) => onSectionChange(v)}
        />
        <Select
          value={quantity}
          onChange={onQuantityChange}
          options={QUANTITY_OPTIONS}
          style={{ width: 140 }}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <List
          bordered
          dataSource={groups}
          renderItem={(group: Ticket[]) => {
            const isHeld = group.some(
              (t) => t.heldByMe || heldTicketIds.includes(t.id),
            );
            return (
              <TicketListItem
                key={group[0].groupId}
                tickets={group}
                onBook={onBook}
                isHeld={isHeld}
                isBlocked={anyHeld && !isHeld}
              />
            );
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <Button disabled={cursorStack.length === 0} onClick={prevPage}>
          Previous
        </Button>
        <Button disabled={!ticketsData?.hasMore} onClick={nextPage}>
          Next
        </Button>
      </div>
    </>
  );
}
