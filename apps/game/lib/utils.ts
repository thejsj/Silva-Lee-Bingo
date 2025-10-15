import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Clue {
  id: string
  emoji: string
  description: string
  name?: string
  photoUrl?: string
}

export function getInitialClues(allClues: Omit<Clue, "id" | "photoUrl">[], count: number): Clue[] {
  const shuffled = [...allClues].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((clue, index) => ({
    ...clue,
    id: `clue-${index}`,
  }))
}

export function checkForBingo(completedClues: { [key: string]: string }, bingoClues: Clue[]): number[] | null {
  const completedIndices = bingoClues
    .map((clue, index) => (completedClues[clue.id] ? index : -1))
    .filter((index) => index !== -1)

  // Check all possible winning combinations
  const winningCombinations = [
    // Rows
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Columns
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonals
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ]

  for (const combination of winningCombinations) {
    if (combination.every((index) => completedIndices.includes(index))) {
      return combination
    }
  }

  return null
}

export function getAllBingoLines(completedClues: { [key: string]: string }, bingoClues: Clue[]): number[][] {
  const completedIndices = bingoClues
    .map((clue, index) => (completedClues[clue.id] ? index : -1))
    .filter((index) => index !== -1)

  // Check all possible winning combinations
  const winningCombinations = [
    // Rows
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Columns
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonals
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ]

  const allBingos: number[][] = []
  for (const combination of winningCombinations) {
    if (combination.every((index) => completedIndices.includes(index))) {
      allBingos.push(combination)
    }
  }

  return allBingos
}
