"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Descriptions, Spin, Tag, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

import { useCancelReservation } from "@/hooks/useCancelReservation";
import { useCurrentUser } from "@/hooks/useCreateBooking";
import { useCreateReservation } from "@/hooks/useCreateReservation";
import { useEvent } from "@/hooks/useEvent";
import { Ticket } from "@/services/events";
import { BookingModal } from "./BookingModal";
import { TicketList } from "./TicketList";

const { Title, Text } = Typography;

const EVENT_TYPE_COLOR: Record<string, string> = {
  concert: "purple",
  sporting: "blue",
  broadway: "gold",
};

export function EventDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [bookingTicket, setBookingTicket] = useState<Ticket | null>(null);

  const { data: currentUser } = useCurrentUser();
  const { data: event, isLoading } = useEvent(id);
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();

  function handleBook(ticket: Ticket) {
    if (!currentUser) return;
    setBookingTicket(ticket);
    createReservation.reset();
    createReservation.mutate({
      userId: currentUser.id,
      ticketIds: [ticket.id],
    });
  }

  function handleCancel() {
    const reservation = createReservation.data;
    if (reservation && currentUser) {
      cancelReservation.mutate({
        reservationToken: reservation.reservationToken,
        body: { ticketIds: reservation.ticketIds },
      });
    }
    setBookingTicket(null);
    createReservation.reset();
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!event) return <div style={{ padding: 32 }}>Event not found.</div>;

  const start = new Date(event.startDatetime);
  const end = new Date(event.endDatetime);
  const datePart = start.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startTime = start.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTime = end.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateStr = `${datePart}, ${startTime} – ${endTime}`;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        type="text"
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        All Events
      </Button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            {event.name}
          </Title>
          <Tag color={EVENT_TYPE_COLOR[event.eventType] ?? "default"}>
            {event.eventType}
          </Tag>
        </div>
        <Text style={{ fontSize: 16, fontWeight: 600 }}>
          {event.eventHost.name}
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 14 }}>
          {dateStr}
        </Text>

        <Descriptions
          style={{ marginTop: 20 }}
          column={{ xs: 1, sm: 2 }}
          bordered
          size="small"
        >
          <Descriptions.Item label="Venue">
            {event.venue.name}
          </Descriptions.Item>
          <Descriptions.Item label="Location">
            {event.venue.addressLine1}
            {event.venue.addressLine2
              ? `, ${event.venue.addressLine2}`
              : ""}, {event.venue.city}
            {event.venue.stateProvince
              ? `, ${event.venue.stateProvince}`
              : ""}{" "}
            {event.venue.postalOrZipCode}
          </Descriptions.Item>
          <Descriptions.Item label="Capacity">
            VIP {event.venue.vipCapacity} · Front Row{" "}
            {event.venue.frontRowCapacity} · GA {event.venue.gaCapacity}
          </Descriptions.Item>
          <Descriptions.Item label="About" span={2}>
            {event.description}
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* Tickets */}
      <Title level={4} style={{ marginBottom: 16 }}>
        Tickets
      </Title>
      <TicketList eventId={id} onBook={handleBook} />

      <BookingModal
        ticket={bookingTicket}
        reservation={createReservation.data}
        isReserving={createReservation.isPending}
        reservationError={createReservation.error as Error | null}
        onClose={handleCancel}
        onConfirmed={() => router.push("/")}
      />
    </div>
  );
}
