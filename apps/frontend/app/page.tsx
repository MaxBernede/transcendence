// "use client";

// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { ModeToggle } from "@/components/mode-toggle";
import Login from "./login";

export default function Home() {
//   const router = useRouter();

  //   useEffect(() => {
  //     // Redirect to the dashboard when the component is mounted
  //     router.push("/dashboard");
  //   }, [router]);

  //   return <div>Hello</div>; // Optionally, you can render a loading spinner or message here

  return (
    <>
      <Login />
    </>
  );
}
