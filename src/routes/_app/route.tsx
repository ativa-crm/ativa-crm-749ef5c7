import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { PerfilProvider } from "@/lib/perfil";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/entrar" });
    return { user: data.user };
  },
  component: () => (
    <PerfilProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </PerfilProvider>
  ),
});
