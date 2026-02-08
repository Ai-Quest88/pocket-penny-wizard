import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAutoSetup() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const didRun = useRef(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const { data: isSetupComplete = false } = useQuery({
    queryKey: ["auto-setup", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;

      // Check if user already has entities
      const { count, error } = await supabase
        .from("entities")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Auto-setup: error checking entities", error);
        return true; // Don't block the app on error
      }

      if ((count ?? 0) > 0) return true;

      // Prevent duplicate runs in React strict mode
      if (didRun.current) return false;
      didRun.current = true;
      setIsSettingUp(true);

      try {
        // Create default entity
        const { data: entity, error: entityError } = await supabase
          .from("entities")
          .insert([
            {
              user_id: session.user.id,
              name: "Personal",
              type: "individual",
              country_of_residence: "AU",
            },
          ])
          .select()
          .single();

        if (entityError) throw entityError;

        // Create default checking account linked to entity
        const { error: assetError } = await supabase.from("assets").insert([
          {
            user_id: session.user.id,
            entity_id: entity.id,
            name: "My Account",
            type: "cash",
            category: "checking_account",
            value: 0,
            currency: "AUD",
          },
        ]);

        if (assetError) throw assetError;

        // Invalidate queries so the rest of the app picks up the new data
        queryClient.invalidateQueries({ queryKey: ["entities"] });
        queryClient.invalidateQueries({ queryKey: ["all-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });

        return true;
      } catch (err) {
        console.error("Auto-setup failed:", err);
        return true; // Don't block the app
      } finally {
        setIsSettingUp(false);
      }
    },
    enabled: !!session?.user?.id,
    staleTime: Infinity,
  });

  return { isSetupComplete, isSettingUp };
}
