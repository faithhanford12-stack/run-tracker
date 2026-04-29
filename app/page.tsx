"use client"

import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore"

import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

type Entry = {
  id?: string
  team: string
  name: string
  minutes?: number
  createdAt?: any
}

type Team = {
  id?: string
  name: string
}

// time ago
const timeAgo = (timestamp: any) => {
  if (!timestamp?.toDate) return "Just now"

  const now = new Date()
  const date = timestamp.toDate()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} day ago`

  return date.toLocaleDateString()
}

export default function Home() {
  const [team, setTeam] = useState("")
  const [name, setName] = useState("")
  const [minutes, setMinutes] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState("")
  const [view, setView] = useState<"dashboard" | "teams">("dashboard")
  const [lastEntryId, setLastEntryId] = useState<string | null>(null)

  const runsRef = collection(db, "runs")
  const teamsRef = collection(db, "teams")

  // RUNS
  useEffect(() => {
    const unsub = onSnapshot(runsRef, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Entry[]
      setEntries(data)
    })
    return () => unsub()
  }, [])

  // TEAMS
  useEffect(() => {
    const unsub = onSnapshot(teamsRef, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Team[]
      setTeams(data)
    })
    return () => unsub()
  }, [])

  // SUBMIT
  const handleSubmit = async () => {
    const num = Number(minutes)

    if (!selectedTeam || !name || !minutes) {
      alert("Fill out all fields")
      return
    }

    const docRef = await addDoc(runsRef, {
      team: selectedTeam,
      name,
      minutes: num,
      createdAt: serverTimestamp(),
    })

    setLastEntryId(docRef.id)
    setMinutes("")
  }

  // UNDO
  const handleUndo = async () => {
    if (!lastEntryId) return
    await deleteDoc(doc(db, "runs", lastEntryId))
    setLastEntryId(null)
  }

  // CREATE TEAM
  const handleCreateTeam = async () => {
    if (!team.trim()) return

    const newTeamName = team.trim()

    await addDoc(teamsRef, {
      name: newTeamName,
    })

    setSelectedTeam(newTeamName)
    setTeam("")
  }

  // totals
  const allTimeTotals: Record<string, number> = {}

  entries.forEach((r) => {
    const v = r.minutes ?? 0
    allTimeTotals[r.team] = (allTimeTotals[r.team] || 0) + v
  })

  // activity sorted by time
  const activity = [...entries]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.().getTime() || 0
      const dateB = b.createdAt?.toDate?.().getTime() || 0
      return dateB - dateA
    })
    .slice(0, 10)

  return (
    <div className={`${inter.className} md:flex min-h-screen bg-[#0f0f0f] text-[#e5e5e5]`}>

      {/* MOBILE HEADER */}
      <div className="md:hidden p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <h1 className="text-lg font-semibold">Fitness</h1>
      </div>

      {/* MOBILE NAV */}
      <div className="md:hidden flex gap-2 p-4">
        <button
          onClick={() => setView("dashboard")}
          className={`flex-1 py-2 rounded ${
            view === "dashboard" ? "bg-[#2f6f73]" : "bg-[#2a2a2a]"
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => setView("teams")}
          className={`flex-1 py-2 rounded ${
            view === "teams" ? "bg-[#2f6f73]" : "bg-[#2a2a2a]"
          }`}
        >
          Teams
        </button>
      </div>

      {/* SIDEBAR (desktop only) */}
      <div className="hidden md:flex w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] p-4 flex-col">
        <h1 className="text-xl font-semibold mb-4">Fitness</h1>

        <div className="space-y-2 text-sm mb-6">
          <div
            onClick={() => setView("dashboard")}
            className={`px-3 py-2 rounded cursor-pointer ${
              view === "dashboard" ? "bg-[#2f6f73]" : "hover:bg-[#2a2a2a]"
            }`}
          >
            Dashboard
          </div>

          <div
            onClick={() => setView("teams")}
            className={`px-3 py-2 rounded cursor-pointer ${
              view === "teams" ? "bg-[#2f6f73]" : "hover:bg-[#2a2a2a]"
            }`}
          >
            Teams
          </div>
        </div>

        <div className="flex-1" />
      </div>

      {/* MAIN */}
      <div className="flex-1 p-4 md:p-6">

        {view === "dashboard" && (
          <>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Dashboard</h2>

            {/* TEAM SELECT */}
            <div className="bg-[#1f1f1f] rounded-xl p-4 mb-4">
              <select
                className="w-full p-3 rounded bg-[#111] border border-[#333]"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Select Team</option>
                {teams.map((t) => (
                  <option key={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* LOG */}
            <div className="bg-[#1f1f1f] rounded-xl p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  className="p-3 rounded bg-[#111] border border-[#333]"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="p-3 rounded bg-[#111] border border-[#333]"
                  placeholder="Minutes"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />

                <button
                  onClick={handleSubmit}
                  className="bg-[#c46a2d] rounded font-semibold"
                >
                  Log
                </button>
              </div>

              {lastEntryId && (
                <div className="mt-3 text-right">
                  <button
                    onClick={handleUndo}
                    className="text-sm text-[#c46a2d] hover:underline"
                  >
                    Undo last entry
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {view === "teams" && (
          <>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Teams</h2>

            <div className="bg-[#1f1f1f] rounded-xl p-4 mb-4 flex gap-2">
              <input
                className="flex-1 p-3 rounded bg-[#111] border border-[#333]"
                placeholder="New team name"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              />
              <button
                onClick={handleCreateTeam}
                className="bg-[#c46a2d] px-4 rounded"
              >
                Add
              </button>
            </div>

            <div className="bg-[#1f1f1f] rounded-xl overflow-hidden">
              {teams
                .map((t) => ({
                  name: t.name,
                  total: allTimeTotals[t.name] || 0,
                }))
                .sort((a, b) => b.total - a.total)
                .map(({ name: teamName, total }, i) => (
                  <div
                    key={teamName}
                    className="flex justify-between px-4 py-3 border-b border-[#2a2a2a]"
                  >
                    <span>{i + 1}. {teamName}</span>
                    <span className="text-[#c46a2d] font-bold">
                      {total} min
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* ACTIVITY (responsive) */}
      <div className="w-full md:w-72 bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-[#2a2a2a] p-4">
        <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>

        {activity.map((a, i) => (
          <div key={i} className="mb-3 text-sm">
            <div className="font-medium">{a.name}</div>
            <div className="text-[#888] text-xs">
              {a.team} • {timeAgo(a.createdAt)}
            </div>
            <div className="text-[#c46a2d] font-semibold">
              {a.minutes ?? 0} min
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}