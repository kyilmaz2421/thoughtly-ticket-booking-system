"use client";

import { useState } from "react";
import { Button, List, Segmented, Spin } from "antd";

import { useTickets } from "@/hooks/useTickets";
import { Ticket } from "@/services/events";
import { TicketListItem } from "./TicketListItem";

// could use the enums from backend but shared type layer is out of scope for this
const SECTIONS = ["All", "VIP", "Front Row", "GA"];

interface Props {
  eventId: string;
  onBook: (ticket: Ticket) => void;
  heldTicketIds: string[];
}

export function TicketList({ eventId, onBook, heldTicketIds }: Props) {
  const [section, setSection] = useState("All");
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  const { data: tickets, isLoading } = useTickets(
    eventId,
    section === "All" ? undefined : section,
    cursor,
  );

  function nextPage() {
    if (!tickets?.nextCursor) return;
    setCursorStack((s) => [...s, cursor ?? ""]);
    setCursor(tickets.nextCursor);
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

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Segmented
          options={SECTIONS}
          value={section}
          onChange={(v) => onSectionChange(v as string)}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <List
          bordered
          dataSource={tickets?.data ?? []}
          renderItem={(ticket: Ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              onBook={onBook}
              isHeld={heldTicketIds.includes(ticket.id)}
              isBlocked={
                heldTicketIds.length > 0 && !heldTicketIds.includes(ticket.id)
              }
            />
          )}
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
        <Button disabled={!tickets?.hasMore} onClick={nextPage}>
          Next
        </Button>
      </div>
    </>
  );
}
