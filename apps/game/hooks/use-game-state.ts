import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"

export type GlobalGameState = "pending" | "active" | "finished"
export type TestMode = "test" | "active"

interface GameStateRecord {
  id: number
  state: string
}

export function useGameState() {
  const [globalGameState, setGlobalGameState] = useState<GlobalGameState | null>(null)
  const [testMode, setTestMode] = useState<TestMode | null>(null)
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
      if (!supabase) {
        setError("Supabase is not configured")
        setIsLoading(false)
        return
      }

      try {
        // Fetch game state from ID 0
        const { data: gameStateData, error: gameStateError } = await supabase
          .from("game_state")
          .select("*")
          .eq("id", 0)
          .single<GameStateRecord>()

        if (gameStateError) {
          if (gameStateError.code === "PGRST116") {
            throw new Error("Game state row with ID 0 does not exist. Please create it in the database.")
          }
          throw gameStateError
        }

        if (!gameStateData) {
          throw new Error("Game state row with ID 0 does not exist. Please create it in the database.")
        }

        // Fetch test mode from ID 1
        const { data: testModeData, error: testModeError } = await supabase
          .from("game_state")
          .select("*")
          .eq("id", 1)
          .single<GameStateRecord>()

        if (testModeError) {
          if (testModeError.code === "PGRST116") {
            throw new Error("Game state row with ID 1 does not exist. Please create it in the database.")
          }
          throw testModeError
        }

        if (!testModeData) {
          throw new Error("Game state row with ID 1 does not exist. Please create it in the database.")
        }

        setGlobalGameState(gameStateData.state as GlobalGameState)
        setTestMode(testModeData.state as TestMode)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching game state:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch game state")
        setIsLoading(false)
      }
    }

    fetchGameState()

    // Subscribe to real-time changes for both game state (ID 0) and test mode (ID 1)
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
          const record = payload.new as GameStateRecord
          setGlobalGameState(record.state as GlobalGameState)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_state",
          filter: "id=eq.1",
        },
        (payload) => {
          const record = payload.new as GameStateRecord
          setTestMode(record.state as TestMode)
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      if (!supabase) return
      supabase.removeChannel(channel)
    }
  }, [])

  return { globalGameState, testMode, isLoading, error }
}
