import assert from "node:assert/strict"
import test from "node:test"
import { generateBoard, validateRoster, type Player } from "./board.ts"

function makeRoster(): Player[] {
  return Array.from({ length: 24 }, (_, playerIndex) => {
    const id = `player-${playerIndex + 1}`
    return {
      id,
      name: `Player ${playerIndex + 1}`,
      clues: [
        { id: `${id}-1`, description: `First clue for ${id}`, emoji: "1" },
        { id: `${id}-2`, description: `Second clue for ${id}`, emoji: "2" },
      ],
    }
  })
}

test("generates 25 unique clues without the current player", () => {
  const board = generateBoard(makeRoster(), "player-1", () => 0.5)

  assert.equal(board.length, 25)
  assert.equal(new Set(board.map((clue) => clue.id)).size, 25)
  assert.equal(board.some((clue) => clue.playerId === "player-1"), false)
})

test("represents all 23 eligible players and repeats exactly two", () => {
  const board = generateBoard(makeRoster(), "player-1", () => 0.25)
  const counts = new Map<string, number>()

  board.forEach((clue) => counts.set(clue.playerId, (counts.get(clue.playerId) ?? 0) + 1))

  assert.equal(counts.size, 23)
  assert.equal([...counts.values()].filter((count) => count === 2).length, 2)
  assert.equal([...counts.values()].filter((count) => count === 1).length, 21)
})

test("uses both clues for each repeated player", () => {
  const roster = makeRoster()
  const board = generateBoard(roster, "player-1", () => 0.75)
  const repeatedPlayerIds = [...new Set(board.map((clue) => clue.playerId))].filter(
    (playerId) => board.filter((clue) => clue.playerId === playerId).length === 2,
  )

  repeatedPlayerIds.forEach((playerId) => {
    const expectedIds = roster.find((player) => player.id === playerId)!.clues.map((clue) => clue.id).sort()
    const actualIds = board
      .filter((clue) => clue.playerId === playerId)
      .map((clue) => clue.id)
      .sort()
    assert.deepEqual(actualIds, expectedIds)
  })
})

test("rejects malformed rosters and unknown current players", () => {
  assert.throws(() => validateRoster(makeRoster().slice(0, 23)), /Expected 24 players/)

  const roster = makeRoster()
  roster[0].clues.pop()
  assert.throws(() => validateRoster(roster), /must have exactly 2 clues/)
  assert.throws(() => generateBoard(makeRoster(), "missing-player"), /not in the roster/)
})
