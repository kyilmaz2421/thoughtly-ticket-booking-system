import { EventDetailPage } from "@/components/events/EventDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventDetailPage id={id} />;
}
