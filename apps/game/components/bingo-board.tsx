import type { Clue } from "@/lib/utils"

interface BingoBoardProps {
  clues: Clue[]
  completedClues: { [key: string]: string }
  onSquareClick: (index: number) => void
  selectedClueIndex: number | null
  bingoLine: number[] | null
}

export default function BingoBoard({
  clues,
  completedClues,
  onSquareClick,
  selectedClueIndex,
  bingoLine,
}: BingoBoardProps) {
  const bingoLetters = ["B", "I", "N", "G", "O"]

  return (
    <div className="w-[360px] mx-auto">
      {bingoLine && (
        <div className="grid grid-cols-5 gap-1 mb-2">
          {bingoLetters.map((letter, colIndex) => {
            // Check if any cell in this column is part of the bingo line
            const columnIndices = [colIndex, colIndex + 5, colIndex + 10, colIndex + 15, colIndex + 20]
            const isHighlighted = columnIndices.some((cellIndex) => bingoLine.includes(cellIndex))

            return (
              <div
                key={colIndex}
                className={`text-center text-2xl font-bold py-2 ${
                  isHighlighted ? "text-bingo-green-button" : "text-transparent"
                }`}
              >
                {letter}
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-5 gap-1 p-2 bg-bingo-green-dark rounded-md shadow-lg">
        {clues.map((clue, index) => {
          const isCompleted = completedClues[clue.id]
          const photoUrl = completedClues[clue.id]
          const isSelected = selectedClueIndex === index
          const isInBingoLine = bingoLine?.includes(index)

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
                    <span className="text-2xl drop-shadow-lg">{clue.emoji}</span>
                  </div>
                </div>
              ) : (
                <span>{clue.emoji}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
