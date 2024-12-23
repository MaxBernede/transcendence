"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard when the component is mounted
    router.push("/dashboard");
  }, [router]);

  return <div></div>; // Optionally, you can render a loading spinner or message here
}
