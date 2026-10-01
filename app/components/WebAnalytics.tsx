"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { useEffect } from "react";
import { analyticsPath, rememberVisitUtm } from "@/lib/utm";

function keepCampaignOnly(event: BeforeSendEvent): BeforeSendEvent {
  return { ...event, url: analyticsPath(event.url) };
}

export function WebAnalytics() {
  useEffect(() => {
    rememberVisitUtm();
  }, []);

  return <Analytics beforeSend={keepCampaignOnly} />;
}
