import { useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";

// Assina mudanças (INSERT/UPDATE/DELETE) em uma ou mais tabelas do Postgres
// e chama `onChange` sempre que algo muda — deixando a tela em tempo real.
//
// Uso:
//   useRealtime("clients", load);
//   useRealtime(["rentals", "clients", "equipment"], load);
//
// Requer que as tabelas estejam na publicação `supabase_realtime` (ver SQL).
export function useRealtime(tables, onChange) {
  // Guarda o callback num ref para não re-assinar a cada render.
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const key = Array.isArray(tables) ? tables.join(",") : tables;

  useEffect(() => {
    const list = Array.isArray(tables) ? tables : [tables];
    // Nome de canal único evita colisão entre telas.
    const channel = supabase.channel(`rt:${key}:${Math.random().toString(36).slice(2)}`);

    list.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => cbRef.current && cbRef.current()
      );
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
