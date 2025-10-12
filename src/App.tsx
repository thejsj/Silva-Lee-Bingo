import { useState, useEffect } from "react"
import NameInputForm from "@/components/name-input-form"
import BingoBoard from "@/components/bingo-board"
import ClueDisplay from "@/components/clue-display"
import FinishScreen from "@/components/finish-screen"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase-client"
import { type Clue, getInitialClues, checkForBingo } from "@/lib/utils"

type GameState = "loading" | "name_input" | "playing" | "clue_view" | "finished"

// Placeholder for your logo
const Logo = () => (
  <div className="text-center my-6 cursor-pointer">
    <h1 className="text-4xl font-bold text-bingo-green-dark">Silva Lee Bingo</h1>
  </div>
)

export default function App() {
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false)
  const [gameState, setGameState] = useState<GameState>("loading")
  const [userName, setUserName] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [allRawClues, setAllRawClues] = useState<Omit<Clue, "id" | "photoUrl">[]>([])
  const [bingoClues, setBingoClues] = useState<Clue[]>([]) // 25 clues for the board
  const [completedClues, setCompletedClues] = useState<{ [key: string]: string }>({}) // clue.id -> photoUrl
  const [selectedClueIndex, setSelectedClueIndex] = useState<number | null>(null)
  const [bingoLine, setBingoLine] = useState<number[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (supabase) {
      setIsSupabaseConfigured(true)
    }
  }, [])

  // Load all clues from JSON
  useEffect(() => {
    fetch("/clues.json")
      .then((res) => res.json())
      .then((data) => {
        setAllRawClues(data)
      })
      .catch(console.error)
  }, [])

  // Initialize game from local storage or set to name_input
  useEffect(() => {
    if (allRawClues.length === 0) return // Wait for clues.json to load

    const storedName = localStorage.getItem("bingoUserName")
    const storedUserId = localStorage.getItem("bingoUserId")
    const storedClues = localStorage.getItem("bingoBoardClues")
    const storedCompleted = localStorage.getItem("bingoCompletedClues")

    if (storedName && storedUserId && storedClues) {
      setUserName(storedName)
      setUserId(storedUserId)
      const parsedClues: Clue[] = JSON.parse(storedClues)
      setBingoClues(parsedClues)
      if (storedCompleted) {
        const parsedCompleted: { [key: string]: string } = JSON.parse(storedCompleted)
        setCompletedClues(parsedCompleted)
        const line = checkForBingo(parsedCompleted, parsedClues)
        setBingoLine(line)
      }
      setGameState("playing")
    } else {
      setGameState("name_input")
    }
  }, [allRawClues])

  const handleNameSubmit = (name: string, userId: string) => {
    const initialBoardClues = getInitialClues(allRawClues, 25)
    setUserName(name)
    setUserId(userId)
    setBingoClues(initialBoardClues)
    setCompletedClues({}) // Reset completed clues
    setBingoLine(null) // Reset bingo line

    localStorage.setItem("bingoUserName", name)
    localStorage.setItem("bingoUserId", userId)
    localStorage.setItem("bingoBoardClues", JSON.stringify(initialBoardClues))
    localStorage.removeItem("bingoCompletedClues") // Clear old completed ones
    setGameState("playing")
  }

  const handleSquareClick = (clueIndex: number) => {
    // If the same square is clicked again, deselect it. Otherwise, select the new one.
    if (selectedClueIndex === clueIndex) {
      setSelectedClueIndex(null)
    } else {
      setSelectedClueIndex(clueIndex)
    }

    // Only change the game state to 'clue_view' if the game is still in progress
    if (gameState === "playing") {
      setGameState("clue_view")
    }
  }

  const handleLogoClick = () => {
    setSelectedClueIndex(null)
    if (gameState === "clue_view") {
      setGameState("playing")
    }
  }

  const BUCKET_NAME = "silva-lee-bingo"

  const handlePhotoUpload = async (file: File, clueId: string) => {
    if (!userName || !userId) return
    if (!supabase) {
      alert("Supabase is not configured. Photo upload is disabled.")
      setIsUploading(false)
      return
    }
    setIsUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userName.replace(/\s+/g, "_")}-${Date.now()}.${fileExt}`
      const filePath = `${BUCKET_NAME}/${fileName}`

      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

      if (!publicUrl) throw new Error("Could not get public URL for uploaded photo.")

      // Find the clue to get emoji and description
      const clue = bingoClues.find((c) => c.id === clueId)
      if (!clue) throw new Error("Clue not found")

      // Insert into photo_submissions table
      const { error: insertError } = await supabase.from("photo_submissions").insert([
        {
          user_id: userId,
          photo_url: publicUrl,
          clue_text: clue.description,
          clue_emoji: clue.emoji,
        },
      ])

      if (insertError) throw insertError

      setCompletedClues((prev) => {
        const newCompleted = { ...prev, [clueId]: publicUrl }
        localStorage.setItem("bingoCompletedClues", JSON.stringify(newCompleted))
        const line = checkForBingo(newCompleted, bingoClues)
        setBingoLine(line)
        return newCompleted
      })
      setGameState("playing") // Go back to board view
      setSelectedClueIndex(null)
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Failed to upload photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImDone = async () => {
    if (!userName || !bingoLine || bingoLine.length !== 5) {
      alert("Bingo not yet achieved or error in submission.")
      return
    }
    if (!supabase) {
      alert("Supabase is not configured. Submission is disabled.")
      return
    }

    const submissionClues = bingoLine.map((index) => {
      const clue = bingoClues[index]
      return {
        emoji: clue.emoji,
        description: clue.description,
        photo_url: completedClues[clue.id] || "N/A",
      }
    })

    try {
      const { error } = await supabase.from("bingo_submissions").insert([
        {
          user_name: userName,
          clue1_emoji: submissionClues[0].emoji,
          clue1_description: submissionClues[0].description,
          clue1_photo_url: submissionClues[0].photo_url,
          clue2_emoji: submissionClues[1].emoji,
          clue2_description: submissionClues[1].description,
          clue2_photo_url: submissionClues[1].photo_url,
          clue3_emoji: submissionClues[2].emoji,
          clue3_description: submissionClues[2].description,
          clue3_photo_url: submissionClues[2].photo_url,
          clue4_emoji: submissionClues[3].emoji,
          clue4_description: submissionClues[3].description,
          clue4_photo_url: submissionClues[3].photo_url,
          clue5_emoji: submissionClues[4].emoji,
          clue5_description: submissionClues[4].description,
          clue5_photo_url: submissionClues[4].photo_url,
        },
      ])
      if (error) throw error
      setGameState("finished")
      setSelectedClueIndex(null) // Deselect any clue when entering finished state
    } catch (error: any) {
      console.error("Error submitting bingo. Full error object:", error)
      let errorMessage = "Failed to submit Bingo. Please check your connection and try again."
      if (error && error.message) {
        errorMessage = `Failed to submit Bingo: ${error.message}`
        if (error.details) errorMessage += ` Details: ${error.details}`
        if (error.hint) errorMessage += ` Hint: ${error.hint}`
      }
      console.error("Formatted Supabase error:", errorMessage)
      alert(errorMessage)
    }
  }

  if (gameState === "loading" || allRawClues.length === 0) {
    return <div className="flex items-center justify-center min-h-screen text-2xl">Loading Game...</div>
  }

  if (gameState === "name_input") {
    return <NameInputForm onSubmit={handleNameSubmit} />
  }

  if (gameState === "finished") {
    const currentClueForDisplay = selectedClueIndex !== null ? bingoClues[selectedClueIndex] : null

    return (
      <div className="flex flex-col items-center justify-start min-h-screen p-4 bg-bingo-green-dark">
        <FinishScreen
          userName={userName!}
          userId={userId!}
          finalClues={bingoClues}
          completedClues={completedClues}
          bingoLine={bingoLine}
          onSquareClick={handleSquareClick}
          selectedClueIndex={selectedClueIndex}
        />
        {currentClueForDisplay && (
          <div className="mt-6 w-full max-w-md bg-bingo-green-light rounded-lg shadow-lg">
            <ClueDisplay
              key={currentClueForDisplay.id} // Added key here
              clue={currentClueForDisplay}
              onPhotoUpload={async () => {}}
              isUploading={false}
              uploadedPhotoUrl={completedClues[currentClueForDisplay.id]}
              isFinishedView={true}
            />
          </div>
        )}
      </div>
    )
  }

  const currentClueForDisplay = selectedClueIndex !== null ? bingoClues[selectedClueIndex] : null

  return (
    <div className="container mx-auto p-4 font-sans bg-bingo-green-light min-h-screen flex flex-col items-center">
      <div onClick={handleLogoClick} className="cursor-pointer">
        <Logo />
      </div>

      {!isSupabaseConfigured && (
        <div className="my-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-center">
          <strong>Warning:</strong> Supabase is not configured. Photo uploads and final score submissions will be
          disabled.
        </div>
      )}

      {bingoLine && gameState === "playing" && (
        <Button
          onClick={handleImDone}
          disabled={!isSupabaseConfigured}
          className="my-4 bg-bingo-green-button hover:bg-bingo-green-button/90 text-white text-xl py-4 px-8 flex items-center justify-center"
        >
          <span role="img" aria-label="trophy" className="mr-3 text-2xl">
            🏆
          </span>
          I'm Done!
          <span role="img" aria-label="trophy" className="ml-3 text-2xl">
            🏆
          </span>
        </Button>
      )}

      <BingoBoard
        clues={bingoClues}
        completedClues={completedClues}
        onSquareClick={handleSquareClick}
        selectedClueIndex={selectedClueIndex}
        bingoLine={bingoLine}
      />

      {gameState === "clue_view" && currentClueForDisplay && (
        <ClueDisplay
          clue={currentClueForDisplay}
          onPhotoUpload={handlePhotoUpload}
          isUploading={isUploading}
          uploadedPhotoUrl={completedClues[currentClueForDisplay.id]}
          isFinishedView={false}
          isSupabaseConfigured={isSupabaseConfigured}
        />
      )}

      {gameState === "playing" && !currentClueForDisplay && (
        <div className="mt-8 p-4 text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-bingo-green-dark mb-3">Instructions:</h2>
          <ol className="list-decimal list-inside text-left space-y-1 text-bingo-green-dark">
            <li>Click on any of the bingo squares.</li>
            <li>Find the person/item for the clue.</li>
            <li>Take and upload a selfie/photo with them.</li>
            <li>
              When you complete 5 in a row (horizontally, vertically, or diagonally), an "I'm Done" button will appear.
              Click it to submit your BINGO!
            </li>
          </ol>
        </div>
      )}

      <div className="mt-auto pt-4 pb-2 text-xs text-bingo-green-dark/70 text-center">
        {userName} • ID: {userId}
      </div>
    </div>
  )
}
