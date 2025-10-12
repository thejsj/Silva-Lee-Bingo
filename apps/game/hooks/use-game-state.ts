import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"

export type GlobalGameState = "pending" | "active" | "finished"

interface GameStateRecord {
  id: number
  state: GlobalGameState
}

export function useGameState() {
  const [globalGameState, setGlobalGameState] = useState<GlobalGameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured")
      setIsLoading(false)
      return
    }

    // Fetch initial game state
    const fetchGameState = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("game_state")
          .select("*")
          .eq("id", 0)
          .single<GameStateRecord>()

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            // No rows found
            throw new Error("Game state row with ID 0 does not exist. Please create it in the database.")
          }
          throw fetchError
        }

        if (!data) {
          throw new Error("Game state row with ID 0 does not exist. Please create it in the database.")
        }

        setGlobalGameState(data.state)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching game state:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch game state")
        setIsLoading(false)
      }
    }

    fetchGameState()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("game_state_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: "id=eq.0",
        },
        (payload) => {
          const newState = (payload.new as GameStateRecord).state
          setGlobalGameState(newState)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { globalGameState, isLoading, error }
}
