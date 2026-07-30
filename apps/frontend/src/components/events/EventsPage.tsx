"use client";

import { useState } from "react";
import { Alert, Button, List, Spin, Typography } from "antd";

import { useCurrentUser } from "@/hooks/useCreateBooking";
import { useEvents } from "@/hooks/useEvents";
import { EventSummary } from "@/services/events";
import { EventListItem } from "./EventListItem";

const { Title } = Typography;

export function EventsPage() {
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<string[]>([]);

  const { data, isLoading } = useEvents(cursor);
  const { error: userError } = useCurrentUser();

  function nextPage() {
    if (!data?.nextCursor) return;
    setCursorStack((s) => [...s, cursor ?? ""]);
    setCursor(data.nextCursor);
  }

  function prevPage() {
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCursor(prev === "" ? undefined : prev);
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Events
      </Title>

      {userError && (
        <Alert
          type="error"
          showIcon
          message="Session unavailable"
          description={(userError as Error).message}
          style={{ marginBottom: 16 }}
        />
      )}

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : (
        <List
          dataSource={data?.data ?? []}
          renderItem={(event: EventSummary) => (
            <EventListItem key={event.id} event={event} />
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
        <Button disabled={!data?.hasMore} onClick={nextPage}>
          Next
        </Button>
      </div>
    </div>
  );
}
