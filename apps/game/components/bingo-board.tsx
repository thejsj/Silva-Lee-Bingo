import type { Clue } from "@/lib/utils"
import { getAllBingoLines } from "@/lib/utils"

interface BingoBoardProps {
  clues: Clue[]
  completedClues: { [key: string]: string }
  onSquareClick: (index: number) => void
  selectedClueIndex: number | null
  bingoLine: number[] | null
}

const BINGO_LETTERS = ["B", "I", "N", "G", "O"]

const findLetterForIndex = (bingoIndices: number[][], index: number) => {
  for (const line of bingoIndices) {
    if (line.includes(index)) {
      return BINGO_LETTERS[line.indexOf(index)]
    }
  }
  return null
}

export default function BingoBoard({
  clues,
  completedClues,
  onSquareClick,
  selectedClueIndex,
}: BingoBoardProps) {
  // Get all bingo lines to determine which letters to highlight
  const allBingoLines = getAllBingoLines(completedClues, clues)

  return (
    <div className="w-[360px] mx-auto">
      <div className="grid grid-cols-5 gap-1 p-2 bg-bingo-green-dark rounded-md shadow-lg">
        {clues.map((clue, index) => {
          const isCompleted = completedClues[clue.id]
          const photoUrl = completedClues[clue.id]
          const isSelected = selectedClueIndex === index
          const isInBingoLine = allBingoLines.some((line) => line.includes(index))

          return (
            <button
              key={clue.id}
              onClick={() => onSquareClick(index)}
              className={`
                aspect-square flex items-center justify-center text-2xl rounded border-2 transition-all
                ${isSelected ? "border-bingo-highlight bg-bingo-highlight/20" : "border-gray-300"}
                ${isInBingoLine ? "ring-2 ring-bingo-green-button" : ""}
                ${isCompleted ? "bg-white/90" : "bg-white"}
                hover:bg-gray-50 active:scale-95
              `}
            >
              {photoUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={photoUrl || "/placeholder.svg"}
                    alt={`Photo for ${clue.description}`}
                    className="absolute inset-0 w-full h-full object-cover rounded opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl drop-shadow-lg">{clue.selectedEmoji}</span>
                  </div>
                  {isInBingoLine && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl drop-shadow-lg text-white">{findLetterForIndex(allBingoLines, index)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <span>{clue.selectedEmoji}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
