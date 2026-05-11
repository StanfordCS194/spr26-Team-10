import { redirect } from "next/navigation";

export default async function ChatRedirectPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      q.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (v) q.append(key, v);
      }
    }
  }
  const qs = q.toString();
  redirect(`/step/3${qs ? `?${qs}` : ""}`);
}
