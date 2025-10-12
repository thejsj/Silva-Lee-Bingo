"use client"

export default function GameClosedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bingo-green-dark">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Silva Lee Bingo</h1>
        <div className="flex items-center justify-center mb-6">
          <span role="img" aria-label="closed" className="text-5xl">
            🔒
          </span>
        </div>
        <p className="text-2xl text-white mb-4">
          The game is already finished!
        </p>
        <p className="text-xl text-white/80">
          You can't join anymore.
        </p>
      </div>
    </div>
  )
}
