"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Volume2, VolumeX, RotateCcw, Trophy } from "lucide-react"

// Game configuration
const RING_COUNT = 4
const SEGMENTS_PER_RING = [6, 8, 10, 12] // Increasing difficulty

const KERALA_FLOWER_PATTERNS = [
  // Ring 1 (Outermost): Marigold petals - bright yellows and oranges
  ["#FFD700", "#FFA500", "#FF8C00", "#FFB347", "#FFCC33", "#FF6347"],
  // Ring 2: Rose petals - pinks and reds
  ["#FF69B4", "#FF1493", "#DC143C", "#B22222", "#FF6B6B", "#FF4757", "#FF3838", "#FF5722"],
  // Ring 3: Jasmine and Chrysanthemum - whites and light yellows
  ["#FFFAF0", "#FFF8DC", "#FFFFE0", "#F0F8FF", "#F5F5DC", "#FAFAD2", "#FFFACD", "#FDF5E6", "#IVORY", "#LINEN"],
  // Ring 4 (Innermost): Mixed tropical flowers - vibrant mix
  [
    "#FF4081",
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
  ],
]

const RING_DESCRIPTIONS = [
  "Outer Border: Golden Marigold Petals",
  "Second Ring: Rose Petals in Crimson Hues",
  "Third Ring: Pure Jasmine & White Chrysanthemums",
  "Inner Circle: Mixed Tropical Flowers",
]

const FLOWER_TYPES = [
  "Thumba", // Marigold
  "Chemparathi", // Hibiscus/Rose
  "Mullai", // Jasmine
  "Kanakambaram", // Mixed tropical
]

interface GameState {
  rings: number[][] // Each ring's current rotation state
  targetPattern: number[][] // The solved pattern
  level: number
  isComplete: boolean
  moves: number
}

export function OnamPuzzleGame() {
  const [gameState, setGameState] = useState<GameState>({
    rings: [],
    targetPattern: [],
    level: 1,
    isComplete: false,
    moves: 0,
  })
  const [isMuted, setIsMuted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const generateTargetPattern = useCallback((level: number) => {
    const rings: number[][] = []
    const targetPattern: number[][] = []

    for (let ringIndex = 0; ringIndex < level; ringIndex++) {
      const segments = SEGMENTS_PER_RING[ringIndex]
      const pattern = Array.from({ length: segments }, (_, i) => i % KERALA_FLOWER_PATTERNS[ringIndex].length)

      // Create shuffled version for current state
      const shuffled = [...pattern]
      const rotations = Math.floor(Math.random() * segments)
      for (let i = 0; i < rotations; i++) {
        shuffled.unshift(shuffled.pop()!)
      }

      rings.push(shuffled)
      targetPattern.push(pattern)
    }

    return { rings, targetPattern }
  }, [])

  const initializeGame = useCallback(() => {
    const { rings, targetPattern } = generateTargetPattern(gameState.level)
    setGameState((prev) => ({
      ...prev,
      rings,
      targetPattern,
      isComplete: false,
      moves: 0,
    }))
  }, [gameState.level, generateTargetPattern])

  const checkCompletion = useCallback(
    (rings: number[][]) => {
      return rings.every((ring, ringIndex) =>
        ring.every((segment, segmentIndex) => segment === gameState.targetPattern[ringIndex]?.[segmentIndex]),
      )
    },
    [gameState.targetPattern],
  )

  const playSound = useCallback(
    (frequency: number, duration = 0.1) => {
      if (isMuted || !audioContextRef.current) return

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)

      oscillator.start(audioContextRef.current.currentTime)
      oscillator.stop(audioContextRef.current.currentTime + duration)
    },
    [isMuted],
  )

  const rotateRing = useCallback(
    (ringIndex: number, direction: "left" | "right" = "right") => {
      setGameState((prev) => {
        const newRings = [...prev.rings]
        const ring = [...newRings[ringIndex]]

        if (direction === "right") {
          ring.unshift(ring.pop()!)
        } else {
          ring.push(ring.shift()!)
        }

        newRings[ringIndex] = ring

        const isComplete = checkCompletion(newRings)
        const newMoves = prev.moves + 1

        // Play sound based on action
        if (isComplete) {
          playSound(800, 0.3) // Success sound
        } else {
          playSound(400 + ringIndex * 100, 0.1) // Click sound with pitch based on ring
        }

        return {
          ...prev,
          rings: newRings,
          isComplete,
          moves: newMoves,
        }
      })
    },
    [checkCompletion, playSound],
  )

  const nextLevel = useCallback(() => {
    if (gameState.level < RING_COUNT) {
      setGameState((prev) => ({ ...prev, level: prev.level + 1 }))
    }
  }, [gameState.level])

  const resetGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, level: 1 }))
  }, [])

  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  useEffect(() => {
    if (gameState.isComplete && gameState.level < RING_COUNT) {
      const timer = setTimeout(() => {
        nextLevel()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState.isComplete, gameState.level, nextLevel])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-yellow-600 to-orange-700 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse opacity-60">
          🌼
        </div>
        <div className="absolute top-20 right-20 w-8 h-8 bg-gradient-to-br from-pink-400 to-red-500 rounded-full animate-bounce opacity-50">
          🌺
        </div>
        <div
          className="absolute bottom-20 left-20 w-6 h-6 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full animate-pulse opacity-40"
          style={{ animationDelay: "1s" }}
        >
          🌸
        </div>
        <div
          className="absolute bottom-10 right-10 w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-bounce opacity-50"
          style={{ animationDelay: "2s" }}
        >
          🍃
        </div>
        <div
          className="absolute top-1/2 left-5 w-5 h-5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse opacity-40"
          style={{ animationDelay: "3s" }}
        >
          🌷
        </div>
        <div
          className="absolute top-1/3 right-10 w-6 h-6 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full animate-bounce opacity-50"
          style={{ animationDelay: "1.5s" }}
        >
          🏵️
        </div>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl animate-pulse">🌺</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-200 via-orange-300 to-red-300 bg-clip-text text-transparent drop-shadow-lg">
              Onam Pookalam Puzzle
            </h1>
            <span className="text-4xl animate-pulse">🌸</span>
          </div>
          <p className="text-yellow-100 text-lg font-medium drop-shadow-md">
            Rotate the flower rings to create the perfect Onam pookalam pattern
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Card className="px-6 py-3 bg-green-900/40 backdrop-blur-sm border-yellow-300/30 shadow-lg">
              <span className="text-yellow-100/80 font-medium">Level: </span>
              <span className="font-bold text-orange-200 text-xl">{gameState.level}</span>
            </Card>
            <Card className="px-6 py-3 bg-green-900/40 backdrop-blur-sm border-yellow-300/30 shadow-lg">
              <span className="text-yellow-100/80 font-medium">Moves: </span>
              <span className="font-bold text-orange-200 text-xl">{gameState.moves}</span>
            </Card>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              className="bg-green-900/40 backdrop-blur-sm border-yellow-300/40 text-yellow-100 hover:bg-green-800/50 shadow-lg"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={initializeGame}
              className="bg-green-900/40 backdrop-blur-sm border-yellow-300/40 text-yellow-100 hover:bg-green-800/50 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-2xl mx-auto relative z-10">
        <div
          className="relative aspect-square bg-gradient-to-br from-yellow-100/20 to-green-100/10 backdrop-blur-md rounded-lg p-8 shadow-2xl border-4 border-yellow-200/30"
          style={{ boxShadow: "0 0 50px rgba(255,215,0,0.3), inset 0 0 50px rgba(34,139,34,0.1)" }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}
          >
            <defs>
              <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#228B22" />
              </radialGradient>
              <radialGradient id="petalGradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
              <pattern id="marigoldTexture" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#FFD700" />
                <circle cx="2" cy="2" r="1" fill="#FFA500" opacity="0.6" />
              </pattern>

              <pattern id="roseTexture" patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill="#FF69B4" />
                <path d="M0,3 Q3,0 6,3 Q3,6 0,3" fill="#FF1493" opacity="0.7" />
              </pattern>

              <pattern id="jasmineTexture" patternUnits="userSpaceOnUse" width="3" height="3">
                <rect width="3" height="3" fill="#FFFAF0" />
                <circle cx="1.5" cy="1.5" r="0.5" fill="#FFF8DC" opacity="0.8" />
              </pattern>

              <pattern id="tropicalTexture" patternUnits="userSpaceOnUse" width="5" height="5">
                <rect width="5" height="5" fill="#FF4081" />
                <polygon points="2.5,0 4,2 2.5,4 1,2" fill="#E91E63" opacity="0.6" />
              </pattern>
            </defs>

            {gameState.rings
              .slice()
              .reverse()
              .map((ring, reverseIndex) => {
                const ringIndex = gameState.rings.length - 1 - reverseIndex
                const segments = SEGMENTS_PER_RING[ringIndex]
                const innerRadius = 60 + ringIndex * 35
                const outerRadius = 85 + ringIndex * 35
                const angleStep = (2 * Math.PI) / segments

                return (
                  <g key={ringIndex}>
                    {ring.map((colorIndex, segmentIndex) => {
                      const startAngle = segmentIndex * angleStep - Math.PI / 2
                      const endAngle = (segmentIndex + 1) * angleStep - Math.PI / 2
                      const midAngle = (startAngle + endAngle) / 2

                      const baseColor = KERALA_FLOWER_PATTERNS[ringIndex][colorIndex]

                      const centerX = 200 + ((innerRadius + outerRadius) / 2) * Math.cos(midAngle)
                      const centerY = 200 + ((innerRadius + outerRadius) / 2) * Math.sin(midAngle)

                      const getFlowerShape = () => {
                        switch (ringIndex) {
                          case 0: // Marigold - ruffled petals
                            return (
                              <g>
                                <ellipse
                                  cx={centerX}
                                  cy={centerY}
                                  rx={(outerRadius - innerRadius) / 2.2}
                                  ry={(outerRadius - innerRadius) / 1.6}
                                  fill={baseColor}
                                  stroke="#B8860B"
                                  strokeWidth="1"
                                  transform={`rotate(${(midAngle * 180) / Math.PI} ${centerX} ${centerY})`}
                                />
                                {/* Ruffled edges */}
                                <ellipse
                                  cx={centerX}
                                  cy={centerY - (outerRadius - innerRadius) / 4}
                                  rx={(outerRadius - innerRadius) / 4}
                                  ry={(outerRadius - innerRadius) / 6}
                                  fill={baseColor}
                                  opacity="0.8"
                                  transform={`rotate(${(midAngle * 180) / Math.PI} ${centerX} ${centerY})`}
                                />
                              </g>
                            )
                          case 1: // Rose - layered petals
                            return (
                              <g>
                                <ellipse
                                  cx={centerX}
                                  cy={centerY}
                                  rx={(outerRadius - innerRadius) / 2.5}
                                  ry={(outerRadius - innerRadius) / 1.8}
                                  fill={baseColor}
                                  stroke="#8B0000"
                                  strokeWidth="1.5"
                                  transform={`rotate(${(midAngle * 180) / Math.PI} ${centerX} ${centerY})`}
                                />
                                {/* Inner petal layer */}
                                <ellipse
                                  cx={centerX}
                                  cy={centerY}
                                  rx={(outerRadius - innerRadius) / 4}
                                  ry={(outerRadius - innerRadius) / 3}
                                  fill="rgba(255,255,255,0.3)"
                                  transform={`rotate(${(midAngle * 180) / Math.PI + 15} ${centerX} ${centerY})`}
                                />
                              </g>
                            )
                          case 2: // Jasmine - small delicate petals
                            return (
                              <g>
                                <circle
                                  cx={centerX}
                                  cy={centerY}
                                  r={(outerRadius - innerRadius) / 3}
                                  fill={baseColor}
                                  stroke="#F0E68C"
                                  strokeWidth="1"
                                />
                                {/* Five small petals around center */}
                                {[0, 1, 2, 3, 4].map((petalIndex) => (
                                  <ellipse
                                    key={petalIndex}
                                    cx={
                                      centerX +
                                      ((outerRadius - innerRadius) / 4) * Math.cos((petalIndex * 2 * Math.PI) / 5)
                                    }
                                    cy={
                                      centerY +
                                      ((outerRadius - innerRadius) / 4) * Math.sin((petalIndex * 2 * Math.PI) / 5)
                                    }
                                    rx={(outerRadius - innerRadius) / 8}
                                    ry={(outerRadius - innerRadius) / 6}
                                    fill="rgba(255,255,255,0.9)"
                                    stroke="#F0E68C"
                                    strokeWidth="0.5"
                                  />
                                ))}
                              </g>
                            )
                          default: // Tropical mix - varied shapes
                            return (
                              <g>
                                <polygon
                                  points={`${centerX},${centerY - (outerRadius - innerRadius) / 2.5} ${centerX + (outerRadius - innerRadius) / 4},${centerY} ${centerX},${centerY + (outerRadius - innerRadius) / 2.5} ${centerX - (outerRadius - innerRadius) / 4},${centerY}`}
                                  fill={baseColor}
                                  stroke="#4B0082"
                                  strokeWidth="1.5"
                                  transform={`rotate(${(midAngle * 180) / Math.PI} ${centerX} ${centerY})`}
                                />
                                <circle
                                  cx={centerX}
                                  cy={centerY}
                                  r={(outerRadius - innerRadius) / 6}
                                  fill="rgba(255,255,255,0.6)"
                                />
                              </g>
                            )
                        }
                      }

                      return (
                        <g
                          key={segmentIndex}
                          className="cursor-pointer hover:brightness-110 transition-all duration-200"
                          onClick={() => rotateRing(ringIndex)}
                          style={{
                            filter: gameState.isComplete ? "brightness(1.3) saturate(1.4)" : "brightness(0.9)",
                          }}
                        >
                          {getFlowerShape()}
                        </g>
                      )
                    })}
                  </g>
                )
              })}

            <circle
              cx="200"
              cy="200"
              r="50"
              fill="url(#centerGradient)"
              stroke="#B8860B"
              strokeWidth="4"
              style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.9))" }}
            />

            <g transform="translate(200,200)">
              {/* Traditional Kerala lamp (Nilavilakku) */}
              <ellipse cx="0" cy="-20" rx="10" ry="25" fill="#FF4500" />
              <ellipse cx="0" cy="-20" rx="7" ry="18" fill="#FFD700" />
              <ellipse cx="0" cy="-20" rx="3" ry="10" fill="#FFFFFF" opacity="0.9" />

              {/* Lamp body */}
              <ellipse cx="0" cy="5" rx="18" ry="12" fill="#B8860B" />
              <ellipse cx="0" cy="5" rx="15" ry="9" fill="#DAA520" />

              {/* Lamp base */}
              <rect x="-20" y="15" width="40" height="6" rx="3" fill="#8B4513" />
              <rect x="-15" y="21" width="30" height="4" rx="2" fill="#A0522D" />
            </g>
          </svg>

          {gameState.isComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-400/90 via-orange-400/90 to-green-400/90 backdrop-blur-sm rounded-full border-4 border-white/50">
              <div className="text-center">
                <Trophy className="w-20 h-20 text-yellow-100 mx-auto mb-4 animate-bounce drop-shadow-lg" />
                <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                  {gameState.level === RING_COUNT ? "🎉 Pookalam Complete! 🎉" : "✨ Level Complete! ✨"}
                </h2>
                <p className="text-white/90 text-lg mb-6 font-medium">Completed in {gameState.moves} moves</p>
                {gameState.level === RING_COUNT && (
                  <Button
                    onClick={resetGame}
                    className="bg-white text-green-600 hover:bg-yellow-100 font-bold px-8 py-3 text-lg shadow-lg border-2 border-white/50"
                  >
                    🌸 Play Again 🌸
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {RING_DESCRIPTIONS.slice(0, gameState.level).map((description, index) => (
            <div key={index} className="bg-green-900/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-200/30">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/50"
                  style={{ backgroundColor: KERALA_FLOWER_PATTERNS[index][0] }}
                />
                <span className="text-yellow-100 text-sm font-medium">{description}</span>
              </div>
              <p className="text-yellow-200/80 text-xs mt-1">Traditional {FLOWER_TYPES[index]} flowers</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="bg-green-900/30 backdrop-blur-sm rounded-lg p-6 border border-yellow-200/30 shadow-lg">
            <h3 className="text-yellow-200 font-bold text-xl mb-3">🎯 How to Solve the Pookalam Puzzle</h3>
            <div className="text-yellow-100 space-y-2 text-left max-w-2xl mx-auto">
              <p>
                <strong>🌸 The Trick:</strong> Start from the outermost ring (marigold border) and work inward!
              </p>
              <p>
                <strong>🔄 Strategy:</strong> Each ring represents a different flower type in traditional pookalam
                layers.
              </p>
              <p>
                <strong>🎨 Goal:</strong> Align all flower petals to create perfect concentric circles of color.
              </p>
              <p>
                <strong>💡 Tip:</strong> Real pookalams have symmetrical patterns - each ring should form a complete
                circle of the same flower type!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
