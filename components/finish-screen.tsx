"use client"

import type { Clue } from "@/lib/utils"
import BingoBoard from "./bingo-board"

interface FinishScreenProps {
  userName: string
  finalClues: Clue[]
  completedClues: { [key: string]: string }
  bingoLine: number[] | null
  onSquareClick: (index: number) => void
  selectedClueIndex: number | null
}

export default function FinishScreen({
  userName,
  finalClues,
  completedClues,
  bingoLine,
  onSquareClick,
  selectedClueIndex,
}: FinishScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold text-white mb-2">Silva Lee Bingo</h1>

      <div className="flex items-center justify-center mb-6">
        <span role="img" aria-label="trophy" className="text-3xl mr-2">
          🏆
        </span>
        <span role="img" aria-label="trophy" className="text-3xl mr-2">
          🏆
        </span>
        <h2 className="text-3xl font-bold text-white">You did it!</h2>
        <span role="img" aria-label="trophy" className="text-3xl ml-2">
          🏆
        </span>
        <span role="img" aria-label="trophy" className="text-3xl ml-2">
          🏆
        </span>
      </div>

      <BingoBoard
        clues={finalClues}
        completedClues={completedClues}
        onSquareClick={onSquareClick}
        selectedClueIndex={selectedClueIndex}
        bingoLine={bingoLine}
      />

      <p className="text-white text-lg mt-4">Congratulations {userName}! Click on any square to view your photos.</p>
    </div>
  )
}
