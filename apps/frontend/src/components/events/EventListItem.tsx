import Link from "next/link";
import { Button, List, Tag, Typography } from "antd";
import { RightOutlined } from "@ant-design/icons";

import { EventSummary } from "@/services/events";

const { Text } = Typography;

const EVENT_TYPE_COLOR: Record<string, string> = {
  concert: "purple",
  sporting: "blue",
  broadway: "gold",
};

function DateBadge({ iso }: { iso: string }) {
  const d = new Date(iso);
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();
  return (
    <div style={{ textAlign: "center", minWidth: 48 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>
        {month}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{day}</div>
    </div>
  );
}

export function EventListItem({ event }: { event: EventSummary }) {
  const d = new Date(event.startDatetime);
  const time = d.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <List.Item
      style={{ padding: "16px 0" }}
      actions={[
        <Link key="find" href={`/events/${event.id}`}>
          <Button type="primary" icon={<RightOutlined />} iconPosition="end">
            Find Tickets
          </Button>
        </Link>,
      ]}
    >
      <Link
        href={`/events/${event.id}`}
        style={{ display: "contents", color: "inherit" }}
      >
        <List.Item.Meta
          avatar={<DateBadge iso={event.startDatetime} />}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text strong>{event.name}</Text>
              <Tag color={EVENT_TYPE_COLOR[event.eventType] ?? "default"}>
                {event.eventType}
              </Tag>
            </div>
          }
          description={
            <>
              <Text type="secondary">
                {time} · {event.venue.name}, {event.venue.city},{" "}
                {event.venue.countryCode}
              </Text>
              <br />
              <Text type="secondary">{event.description}</Text>
            </>
          }
        />
      </Link>
    </List.Item>
  );
}
