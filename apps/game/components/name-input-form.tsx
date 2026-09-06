"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { GlobalGameState } from "@/hooks/use-game-state"
import type { Player } from "@/lib/utils"

interface NameInputFormProps {
  players: Player[]
  onSubmit: (name: string, userId: string, rosterPlayerId: string) => void
  globalGameState: GlobalGameState | null
}

export default function NameInputForm({ players, onSubmit, globalGameState }: NameInputFormProps) {
  const [rosterPlayerId, setRosterPlayerId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if game state allows name submission
    if (globalGameState === "finished") {
      alert("The game has ended. You can no longer join.")
      return
    }

    const selectedPlayer = players.find((player) => player.id === rosterPlayerId)
    if (selectedPlayer && !isSubmitting) {
      setIsSubmitting(true)
      try {
        const { supabase } = await import("@/lib/supabase-client")

        if (!supabase) {
          // Fallback if Supabase is not configured
          const fallbackId = `local-${Date.now()}`
          onSubmit(selectedPlayer.name, fallbackId, selectedPlayer.id)
          return
        }

        // Insert user into Supabase
        const { data, error } = await supabase
          .from("users")
          .insert([{ name: selectedPlayer.name }])
          .select()
          .single()

        if (error) throw error

        onSubmit(data.name, data.id, selectedPlayer.id)
      } catch (error) {
        console.error("Error creating user:", error)
        alert("Failed to create user. Please try again.\n\nError: " + error)
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bingo-green-light">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-bingo-green-dark mb-4">Silva Lee Bingo</h1>
        <p className="text-xl text-bingo-green-dark">Welcome! Let's get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <div>
          <label htmlFor="rosterPlayer" className="block text-lg font-medium text-bingo-green-dark mb-2 text-center">
            Select your name:
          </label>
          <select
            id="rosterPlayer"
            value={rosterPlayerId}
            onChange={(e) => setRosterPlayerId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-3 text-center text-lg"
            required
          >
            <option value="">Choose your name...</option>
            {[...players]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
          </select>
        </div>

        <Button
          type="submit"
          disabled={!rosterPlayerId || isSubmitting}
          className="w-full bg-bingo-green-button hover:bg-bingo-green-button/90 text-white text-xl py-4 flex items-center justify-center"
        >
          <span role="img" aria-label="start" className="mr-3 text-2xl">
            🎯
          </span>
          Start Game
          <span role="img" aria-label="start" className="ml-3 text-2xl">
            🎯
          </span>
        </Button>
      </form>
    </div>
  )
}
