"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GlobalGameState } from "@/hooks/use-game-state"

interface NameInputFormProps {
  onSubmit: (name: string, userId: string) => void
  globalGameState: GlobalGameState | null
}

interface ClueData {
  name: string
  description: string
  emoji: string
}

export default function NameInputForm({ onSubmit, globalGameState }: NameInputFormProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allNames, setAllNames] = useState<string[]>([])

  // Load all names from clues-final.json
  useEffect(() => {
    fetch("/clues.json")
      .then((res) => res.json())
      .then((data: ClueData[]) => {
        const names = data.map((clue) => clue.name).sort()
        setAllNames(names)
      })
      .catch((error) => console.error("Error loading names:", error))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if game state allows name submission
    if (globalGameState === "finished") {
      alert("The game has ended. You can no longer join.")
      return
    }

    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true)
      try {
        const { supabase } = await import("@/lib/supabase-client")

        if (!supabase) {
          // Fallback if Supabase is not configured
          const fallbackId = `local-${Date.now()}`
          onSubmit(name.trim(), fallbackId)
          return
        }

        // Insert user into Supabase
        const { data, error } = await supabase
          .from("users")
          .insert([{ name: name.trim() }])
          .select()
          .single()

        if (error) throw error

        onSubmit(data.name, data.id)
      } catch (error) {
        console.error("Error creating user:", error)
        alert("Failed to create user. Please try again.")
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
          <label htmlFor="name" className="block text-lg font-medium text-bingo-green-dark mb-2 text-center">
            Enter your name:
          </label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name here..."
            className="text-center text-lg py-3"
            list="names-list"
            autoComplete="off"
            required
          />
          <datalist id="names-list">
            {allNames.map((nameOption) => (
              <option key={nameOption} value={nameOption} />
            ))}
          </datalist>
        </div>

        <Button
          type="submit"
          disabled={!name.trim() || isSubmitting}
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
