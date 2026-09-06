export interface PlayerClue {
  id: string
  description: string
  emoji: string
}

export interface Player {
  id: string
  name: string
  clues: PlayerClue[]
}

export interface Clue {
  id: string
  playerId: string
  name: string
  description: string
  selectedEmoji: string
}

const EXPECTED_PLAYER_COUNT = 24
const CLUES_PER_PLAYER = 2

export function validateRoster(players: Player[]): void {
  if (players.length !== EXPECTED_PLAYER_COUNT) {
    throw new Error(`Expected ${EXPECTED_PLAYER_COUNT} players, but found ${players.length}.`)
  }

  const playerIds = new Set<string>()
  const clueIds = new Set<string>()

  players.forEach((player) => {
    if (!player.id || !player.name) {
      throw new Error("Every player must have an ID and name.")
    }
    if (playerIds.has(player.id)) {
      throw new Error(`Duplicate player ID: ${player.id}`)
    }
    if (player.clues.length !== CLUES_PER_PLAYER) {
      throw new Error(`${player.name} must have exactly ${CLUES_PER_PLAYER} clues.`)
    }

    playerIds.add(player.id)
    player.clues.forEach((clue) => {
      if (!clue.id || !clue.description || !clue.emoji) {
        throw new Error(`Every clue for ${player.name} must have an ID, description, and emoji.`)
      }
      if (clueIds.has(clue.id)) {
        throw new Error(`Duplicate clue ID: ${clue.id}`)
      }
      clueIds.add(clue.id)
    })
  })
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function toBoardClue(player: Player, clue: PlayerClue): Clue {
  return {
    id: clue.id,
    playerId: player.id,
    name: player.name,
    description: clue.description,
    selectedEmoji: clue.emoji,
  }
}

export function generateBoard(players: Player[], currentPlayerId: string, random = Math.random): Clue[] {
  validateRoster(players)

  if (!players.some((player) => player.id === currentPlayerId)) {
    throw new Error("The selected player is not in the roster.")
  }

  const eligiblePlayers = players.filter((player) => player.id !== currentPlayerId)
  const selectedByPlayer = eligiblePlayers.map((player) => {
    const clues = shuffle(player.clues, random)
    return {
      player,
      primary: clues[0],
      secondary: clues[1],
    }
  })

  const repeatedPlayers = shuffle(selectedByPlayer, random).slice(0, 2)
  const board = [
    ...selectedByPlayer.map(({ player, primary }) => toBoardClue(player, primary)),
    ...repeatedPlayers.map(({ player, secondary }) => toBoardClue(player, secondary)),
  ]

  return shuffle(board, random)
}
