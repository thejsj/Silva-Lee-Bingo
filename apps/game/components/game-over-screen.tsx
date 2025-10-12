"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

interface GameOverScreenProps {
  userName: string
  userId: string
}

export default function GameOverScreen({ userName, userId }: GameOverScreenProps) {
  const [photoCount, setPhotoCount] = useState<number>(0)
  const [bingoCount, setBingoCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch photo submissions count
        const { count: photoSubmissions, error: photoError } = await supabase
          .from("photo_submissions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)

        if (photoError) throw photoError

        // Fetch bingo submissions count
        const { count: bingoSubmissions, error: bingoError } = await supabase
          .from("bingo_submissions")
          .select("*", { count: "exact", head: true })
          .eq("user_name", userName)

        if (bingoError) throw bingoError

        setPhotoCount(photoSubmissions || 0)
        setBingoCount(bingoSubmissions || 0)
      } catch (error) {
        console.error("Error fetching user stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [userId, userName])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bingo-green-dark">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Silva Lee Bingo</h1>
        <div className="flex items-center justify-center mb-6">
          <span role="img" aria-label="party" className="text-5xl">
            🎉
          </span>
        </div>
        <p className="text-2xl text-white mb-6">
          Thanks for playing, {userName}!
        </p>

        {isLoading ? (
          <p className="text-xl text-white/80">Loading your stats...</p>
        ) : (
          <div className="bg-white/10 rounded-lg p-6 max-w-md mx-auto">
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-white">{photoCount}</p>
                <p className="text-lg text-white/80">Photo Submission{photoCount !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{bingoCount}</p>
                <p className="text-lg text-white/80">Bingo{bingoCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 pb-2 text-xs text-white/70 text-center">
        {userName} • ID: {userId}
      </div>
    </div>
  )
}
