import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HIDDEN_PREFIXES = ["/login", "/studio/recorder"];

export function TeleprompterFab() {
  const { pathname } = useLocation();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!signedIn) return null;
  if (pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <Link
      to="/studio/recorder"
      aria-label="Open teleprompter recorder"
      title="Teleprompter — quick record"
      className="fixed z-50 bottom-5 right-5 size-14 rounded-full bg-foreground text-background grid place-items-center shadow-lg ring-4 ring-background hover:scale-105 active:scale-95 transition"
    >
      <Camera className="size-6" />
    </Link>
  );
}
