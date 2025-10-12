import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase-client"

type TabType = "board" | "settings"
type GameStateType = "pending" | "active" | "finished"

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("board")
  const [gameState, setGameState] = useState<GameStateType>("pending")
  const [userCount, setUserCount] = useState<number>(0)
  const [photoSubmissionCount, setPhotoSubmissionCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
        "2. Delete all photo submissions\n" +
        "3. Delete all users\n" +
        "4. Delete all photos from the bucket\n\n" +
        "This action cannot be undone!",
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      // 1. Set game to pending
      const { error: gameStateError } = await supabase.from("game_state").update({ state: "pending" }).eq("id", 0)
      if (gameStateError) throw gameStateError

      // 2. Get all photos from bucket to delete them
      const { data: files, error: listError } = await supabase.storage.from("silva-lee-bingo").list()

      if (listError) throw listError

      // Delete all files from bucket
      if (files && files.length > 0) {
        const filePaths = files.map((file) => `silva-lee-bingo/${file.name}`)
        const { error: deleteFilesError } = await supabase.storage.from("silva-lee-bingo").remove(filePaths)
        if (deleteFilesError) throw deleteFilesError
      }

      // 3. Delete all photo submissions
      const { error: photoSubmissionsError } = await supabase.from("photo_submissions").delete().neq("id", 0)
      if (photoSubmissionsError) throw photoSubmissionsError

      // 4. Delete all users
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Supabase Not Configured</h2>
          <p className="text-lg">Please configure Supabase to use this control plane.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-300 bg-white shadow-sm">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
            activeTab === "board"
              ? "bg-blue-500 text-white border-b-4 border-blue-700"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 px-6 py-4 text-lg font-semibold transition-colors ${
            activeTab === "settings"
              ? "bg-blue-500 text-white border-b-4 border-blue-700"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "board" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Board View</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Board content coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto">
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
