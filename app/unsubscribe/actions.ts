"use server";

import { redirect } from "next/navigation";
import { unsubscribeCommunity } from "@/lib/community-subscribers";

export async function confirmCommunityUnsubscribe(formData: FormData) {
  const token = formData.get("token");
  const result = await unsubscribeCommunity(
    typeof token === "string" ? token : "",
  );
  redirect(`/unsubscribe?result=${result}`);
}
