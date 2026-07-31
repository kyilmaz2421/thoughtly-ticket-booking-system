"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Result,
  Spin,
  Tag,
  Typography,
} from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

import { useConfirmBooking } from "@/hooks/useCreateBooking";
import { Reservation } from "@/services/bookings";
import { Ticket } from "@/services/events";

const { Text } = Typography;

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function secondsUntil(isoDate: string) {
  return Math.max(
    0,
    Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000),
  );
}

interface Props {
  ticket: Ticket | null;
  reservation: Reservation | undefined;
  isReserving: boolean;
  reservationError: Error | null;
  onClose: () => void; // X — just dismisses the modal, hold remains active
  onCancel: () => void; // Cancel Reservation button — releases the hold
  onConfirmed: () => void;
}

export function BookingModal({
  ticket,
  reservation,
  isReserving,
  reservationError,
  onClose,
  onCancel,
  onConfirmed,
}: Props) {
  const [form] = Form.useForm();
  const [tick, setTick] = useState(0);

  const confirmBooking = useConfirmBooking();
  const confirmation = confirmBooking.data ?? null;
  const confirmError = confirmBooking.error as Error | null;

  // Derive secondsLeft from expiresAt on every render — tick drives re-renders each second.
  // Avoids calling setState synchronously inside an effect (lint: react-hooks/set-state-in-effect).
  const secondsLeft = reservation ? secondsUntil(reservation.expiresAt) : 0;

  useEffect(() => {
    if (!reservation || confirmation || secondsLeft <= 0) return;
    const id = setTimeout(() => setTick((t) => t + 1), 1000);
    return () => clearTimeout(id);
  }, [reservation, confirmation, secondsLeft, tick]);

  const expired = !!reservation && secondsLeft <= 0 && !confirmation;
  const timerColor =
    secondsLeft <= 60 ? "#f5222d" : secondsLeft <= 180 ? "#fa8c16" : "#52c41a";

  function onSubmit(values: {
    email: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    postalCode: string;
  }) {
    if (!ticket || !reservation) return;
    confirmBooking.mutate({
      reservationToken: reservation.reservationToken,
      body: {
        userId: reservation.userId,
        ticketIds: [ticket.id],
        email: values.email,
        payment: {
          cardNumber: values.cardNumber,
          expiry: values.expiry,
          cvv: values.cvv,
          postalCode: values.postalCode,
        },
      },
    });
  }

  const isConfirming = confirmBooking.isPending;

  return (
    <Modal
      open={!!ticket}
      onCancel={confirmation ? onConfirmed : onClose}
      footer={null}
      title="Complete Your Booking"
      width={480}
      destroyOnClose
      closable={!isConfirming}
    >
      {confirmation ? (
        <Result
          status="success"
          title="Booking Confirmed!"
          subTitle={`Confirmation #${confirmation.transactionId} · A receipt will be sent to ${confirmation.email}`}
          extra={
            <Button type="primary" onClick={onConfirmed}>
              Done
            </Button>
          }
        />
      ) : isReserving ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Holding your ticket…</Text>
          </div>
        </div>
      ) : (
        <>
          {/* Ticket summary */}
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tag>{ticket?.section}</Tag>
                <Text strong>Seat {ticket?.seatNumber}</Text>
              </div>
              <Text strong style={{ fontSize: 18 }}>
                {ticket?.priceDisplay}
              </Text>
            </div>
          </div>

          {/* Reservation hold error (ticket already taken, etc.) */}
          {reservationError && !reservation && (
            <Alert
              message={reservationError.message}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Timer — only shown once hold is established */}
          {reservation && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              <ClockCircleOutlined style={{ color: timerColor }} />
              <Text style={{ color: timerColor, fontWeight: 600 }}>
                {expired
                  ? "Ticket reserved for you expired — please close and try again"
                  : `Ticket that is reserved for you expires in ${formatTime(secondsLeft)}`}
              </Text>
            </div>
          )}

          {expired && (
            <Alert
              message="Your hold has expired. Close and select the ticket again."
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Divider style={{ margin: "0 0 16px" }} />

          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            disabled={expired || isConfirming || !reservation}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Valid email required",
                },
              ]}
            >
              <Input placeholder="jane@example.com" />
            </Form.Item>

            <Divider plain style={{ margin: "4px 0 16px" }}>
              Payment
            </Divider>

            <Form.Item
              label="Card Number"
              name="cardNumber"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="4242 4242 4242 4242" maxLength={19} />
            </Form.Item>
            <div style={{ display: "flex", gap: 12 }}>
              <Form.Item
                label="Expiry"
                name="expiry"
                rules={[{ required: true, message: "Required" }]}
                style={{ flex: 1 }}
              >
                <Input
                  placeholder="MM/YY"
                  maxLength={5}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 4);
                    const formatted =
                      digits.length > 2
                        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                        : digits;
                    form.setFieldValue("expiry", formatted);
                  }}
                />
              </Form.Item>
              <Form.Item
                label="CVV"
                name="cvv"
                rules={[{ required: true, message: "Required" }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="123" maxLength={4} />
              </Form.Item>
            </div>
            <Form.Item
              label="Postal / ZIP Code"
              name="postalCode"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="10001" maxLength={10} />
            </Form.Item>

            {/* Payment error — shows the actual message from MockStripeError */}
            {confirmError && (
              <Alert
                message={confirmError.message}
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
              />
            )}

            <Button
              type="primary"
              htmlType="submit"
              loading={isConfirming}
              disabled={expired || !reservation}
              block
              size="large"
            >
              Confirm Booking · {ticket?.priceDisplay}
            </Button>

            <Button
              danger
              block
              size="large"
              disabled={isConfirming}
              onClick={onCancel}
              style={{ marginTop: 8 }}
            >
              Cancel Reservation
            </Button>
          </Form>
        </>
      )}
    </Modal>
  );
}
