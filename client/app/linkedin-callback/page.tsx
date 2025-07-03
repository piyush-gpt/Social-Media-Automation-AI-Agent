'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LinkedInCallback() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      fetch("http://localhost:8000/api/linkedin/exchange", {
        method: "POST",
        body: JSON.stringify({ code }),
        headers: { "Content-Type": "application/json" },
      })
        .then(res => res.json())
        .then(data => {
          console.log("LinkedIn token exchange response:", data);
          if (data.access_token) {
            localStorage.setItem("linkedin_access_token", data.access_token);
            router.push("/agent");
          } else {
            alert("LinkedIn authentication failed.");
            router.push("/");
          }
        });
    }
  }, [router]);

  return <div className="flex items-center justify-center min-h-screen">Authenticating with LinkedIn...</div>;
} 