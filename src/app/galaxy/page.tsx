import GalaxyClient from "./GalaxyClient";
import { Meta } from "@once-ui-system/core";
import { baseURL, galaxy } from "@/resources/";

export async function generateMetadata() {
  return Meta.generate({
    title: galaxy.title,
    description: galaxy.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(galaxy.title)}`,
    path: galaxy.path,
  });
}

export default function Page() {
  return <GalaxyClient />;
}