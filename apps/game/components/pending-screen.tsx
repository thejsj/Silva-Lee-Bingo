"use client"

interface PendingScreenProps {
  userName: string
  userId: string
}

export default function PendingScreen({ userName, userId }: PendingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bingo-green-light">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-bingo-green-dark mb-4">Silva Lee Bingo</h1>
        <div className="flex items-center justify-center mb-6">
          <span role="img" aria-label="hourglass" className="text-9xl p-8">
            ⏳
          </span>
        </div>
        <p className="text-2xl text-bingo-green-dark mb-4">
          Thanks for joining, {userName}!
        </p>
        <p className="text-xl text-bingo-green-dark">
          The game will start shortly...
        </p>
      </div>

      <div className="mt-auto pt-4 pb-2 text-xs text-bingo-green-dark/70 text-center">
        {userName} • ID: {userId}
      </div>
    </div>
  )
}
