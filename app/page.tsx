import type { Metadata } from "next";
import { getDiscovery } from "@/data/index";
import { HomePage } from "./components/home/HomePage";

const discovery = getDiscovery("pod-adventure-brite-tumbler-20oz");

export const metadata: Metadata = {
  title: discovery.seo_title,
  description: discovery.seo_description,
};

export default function Page() {
  return (
    <main>
      <HomePage discovery={discovery} />
    </main>
  );
}
