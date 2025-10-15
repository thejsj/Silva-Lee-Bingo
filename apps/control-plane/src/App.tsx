import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "./lib/supabase-client"

type TabType = "board" | "settings"
type GameStateType = "pending" | "active" | "finished"
type LeaderboardEntry = {
  user_id: string
  name: string
  submission_count: number
}
type PhotoSubmission = {
  id: string
  user_id: string
  photo_url: string
  created_at: string
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("board")
  const [gameState, setGameState] = useState<GameStateType>("pending")
  const [userCount, setUserCount] = useState<number>(0)
  const [photoSubmissionCount, setPhotoSubmissionCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [photos, setPhotos] = useState<PhotoSubmission[]>([])
  const leaderboardTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial game state
  useEffect(() => {
    loadGameState()
  }, [])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!supabase) return

    // Load initial counts
    loadCounts()

    // Subscribe to users table changes
    const usersChannel = supabase
      .channel("users-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        loadUserCount()
      })
      .subscribe()

    // Subscribe to photo_submissions table changes
    const photoSubmissionsChannel = supabase
      .channel("photo-submissions-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "photo_submissions" }, () => {
        loadPhotoSubmissionCount()
      })
      .subscribe()

    // Subscribe to game_state changes
    const gameStateChannel = supabase
      .channel("game-state-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, () => {
        loadGameState()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(usersChannel)
      supabase.removeChannel(photoSubmissionsChannel)
      supabase.removeChannel(gameStateChannel)
    }
  }, [])

  // Debounced leaderboard refresh function
  const debouncedLoadLeaderboard = useCallback(() => {
    // Clear any existing timer
    if (leaderboardTimerRef.current) {
      clearTimeout(leaderboardTimerRef.current)
    }

    // Set a new timer to refresh leaderboard after 500ms
    leaderboardTimerRef.current = setTimeout(() => {
      loadLeaderboard()
    }, 500)
  }, [])

  // Load initial leaderboard
  useEffect(() => {
    if (!supabase) return
    loadLeaderboard()
  }, [])

  // Set up realtime listener for photo submissions
  useEffect(() => {
    if (!supabase) return

    // Load initial photos
    loadPhotos()

    // Subscribe to photo_submissions changes
    const photosChannel = supabase
      .channel("photos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "photo_submissions" }, () => {
        loadPhotos()
        debouncedLoadLeaderboard()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(photosChannel)
      // Clear any pending leaderboard refresh timer
      if (leaderboardTimerRef.current) {
        clearTimeout(leaderboardTimerRef.current)
      }
    }
  }, [debouncedLoadLeaderboard])

  const loadGameState = async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from("game_state").select("state").eq("id", 0).single()

      if (error) throw error

      if (data) {
        setGameState(data.state as GameStateType)
      }
    } catch (error) {
      console.error("Error loading game state:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCounts = () => {
    loadUserCount()
    loadPhotoSubmissionCount()
  }

  const loadUserCount = async () => {
    if (!supabase) return

    try {
      const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })

      if (error) throw error
      setUserCount(count || 0)
    } catch (error) {
      console.error("Error loading user count:", error)
    }
  }

  const loadPhotoSubmissionCount = async () => {
    if (!supabase) return

    try {
      const { count, error } = await supabase
        .from("photo_submissions")
        .select("*", { count: "exact", head: true })

      if (error) throw error
      setPhotoSubmissionCount(count || 0)
    } catch (error) {
      console.error("Error loading photo submission count:", error)
    }
  }

  const loadLeaderboard = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from("photo_submissions")
        .select("user_id")
        .order("user_id")

      if (error) throw error

      // Group by user_id and count submissions
      const leaderboardMap = new Map<string, number>()
      data?.forEach((submission) => {
        const count = leaderboardMap.get(submission.user_id) || 0
        leaderboardMap.set(submission.user_id, count + 1)
      })

      // Fetch user names
      const userIds = Array.from(leaderboardMap.keys())
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds)

      if (usersError) throw usersError

      // Create a map of user_id to name
      const userNameMap = new Map<string, string>()
      users?.forEach((user) => {
        userNameMap.set(user.id, user.name)
      })

      // Convert to array and sort by submission count
      const leaderboardArray: LeaderboardEntry[] = Array.from(leaderboardMap.entries())
        .map(([user_id, submission_count]) => ({
          user_id,
          name: userNameMap.get(user_id) || user_id,
          submission_count,
        }))
        .sort((a, b) => b.submission_count - a.submission_count)

      setLeaderboard(leaderboardArray)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    }
  }

  const loadPhotos = async () => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from("photo_submissions")
        .select("id, user_id, photo_url, created_at")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error("Error loading photos:", error)
    }
  }

  const handleGameStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      alert("Supabase is not configured")
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from("game_state").update({ state: gameState }).eq("id", 0)

      if (error) throw error

      alert("Game state updated successfully!")
    } catch (error) {
      console.error("Error updating game state:", error)
      alert("Failed to update game state. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAllGameState = async () => {
    if (!supabase) {
      alert("Supabase is not configured")
      return
    }

    const confirmed = confirm(
      "Are you sure you want to delete all game state? This will:\n\n" +
        "1. Set game to 'pending'\n" +
        "2. Delete all bingo submissions\n" +
        "3. Delete all photo submissions\n" +
        "4. Delete all users\n" +
        "5. Delete all photos from the bucket\n\n" +
        "This action cannot be undone!",
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      // 1. Set game to pending
      const { error: gameStateError } = await supabase.from("game_state").update({ state: "pending" }).eq("id", 0)
      if (gameStateError) throw gameStateError

      // 2. Delete all bingo submissions (must be before photo_submissions due to foreign key)
      const { error: bingoSubmissionsError } = await supabase.from("bingo_submissions").delete().neq("id", 0)
      if (bingoSubmissionsError) throw bingoSubmissionsError

      // 3. Get all photos from bucket to delete them
      const { data: files, error: listError } = await supabase.storage.from("silva-lee-bingo").list()

      if (listError) throw listError

      // Delete all files from bucket
      if (files && files.length > 0) {
        const filePaths = files.map((file) => `silva-lee-bingo/${file.name}`)
        const { error: deleteFilesError } = await supabase.storage.from("silva-lee-bingo").remove(filePaths)
        if (deleteFilesError) throw deleteFilesError
      }

      // 4. Delete all photo submissions
      const { error: photoSubmissionsError } = await supabase.from("photo_submissions").delete().neq("id", 0)
      if (photoSubmissionsError) throw photoSubmissionsError

      // 5. Delete all users
      const { error: usersError } = await supabase.from("users").delete().neq("id", "")
      if (usersError) throw usersError

      setGameState("pending")
      alert("All game state has been deleted successfully!")
    } catch (error) {
      console.error("Error deleting game state:", error)
      alert("Failed to delete game state. Please check the console for details.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Supabase Not Configured</h2>
          <p className="text-lg">Please configure Supabase to use this control plane.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-300 shadow-sm">
        <button
          onClick={() => setActiveTab("board")}
          className={`px-[10px] py-[10px] mx-[5px] text-[10px] font-semibold transition-colors border-b-2 ${
            activeTab === "board"
              ? "border-green-500"
              : "border-transparent"
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-[10px] py-[10px] mx-[5px] text-[10px] font-semibold transition-colors border-b-2 ${
            activeTab === "settings"
              ? "border-green-500"
              : "border-transparent"
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "board" && (
          <div className="flex w-full h-full gap-6">
            <div className="flex-1">
              {photos.length === 0 ? (
                <p className="text-gray-600">No photos yet</p>
              ) : (
                <div>
                  {/* First 2 rows: 4 pictures per row */}
                  {photos.slice(0, 8).length > 0 && (
                    <div className="grid grid-cols-4">
                      {photos.slice(0, 8).map((photo) => (
                        <div key={photo.id} className="aspect-square overflow-hidden">
                          <img
                            src={photo.photo_url}
                            alt={`Submission by ${photo.user_id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Remaining rows: 6 pictures per row */}
                  {photos.slice(8).length > 0 && (
                    <div className="grid grid-cols-6">
                      {photos.slice(8).map((photo) => (
                        <div key={photo.id} className="aspect-square overflow-hidden">
                          <img
                            src={photo.photo_url}
                            alt={`Submission by ${photo.user_id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="w-[400px] p-6">
              <h2 className="text-xl font-bold mb-2 text-gray-800">Leaderboard</h2>
              <div className="bg-white rounded-lg shadow p-6">
                {leaderboard.length === 0 ? (
                  <p className="text-gray-600">No submissions yet</p>
                ) : (
                  <ol className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <li key={entry.user_id} className="flex justify-between items-center">
                        <span className="text-gray-800">
                          {index + 1}. {entry.name}
                        </span>
                        <span className="font-semibold text-green-600">{entry.submission_count}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto mt-6 mb-6">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Settings</h2>

            {/* Realtime Counters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Realtime Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-1">Users</div>
                  <div className="text-3xl font-bold text-blue-700">{userCount}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 font-medium mb-1">Photo Submissions</div>
                  <div className="text-3xl font-bold text-green-700">{photoSubmissionCount}</div>
                </div>
              </div>
            </div>

            {/* Game State Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Game State</h3>
              <form onSubmit={handleGameStateSubmit} className="space-y-4">
                <div>
                  <label htmlFor="gameState" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Game State
                  </label>
                  <select
                    id="gameState"
                    value={gameState}
                    onChange={(e) => setGameState(e.target.value as GameStateType)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Submit"}
                </button>
              </form>
            </div>

            {/* Delete All Game State */}
            <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
              <h3 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h3>
              <p className="text-gray-700 mb-4">
                This will reset the entire game, including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Set game state to "pending"</li>
                  <li>Delete all bingo submissions</li>
                  <li>Delete all photo submissions</li>
                  <li>Delete all users</li>
                  <li>Delete all photos from the bucket</li>
                </ul>
              </p>
              <button
                onClick={handleDeleteAllGameState}
                disabled={isDeleting}
                className="w-full bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete All Game State"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
