"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NameInputFormProps {
  onSubmit: (name: string) => void
}

export default function NameInputForm({ onSubmit }: NameInputFormProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
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
            required
          />
        </div>

        <Button
          type="submit"
          disabled={!name.trim()}
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
