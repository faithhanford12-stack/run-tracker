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

  const handleUndo = async () => {
    if (!lastEntryId) return
    await deleteDoc(doc(db, "runs", lastEntryId))
    setLastEntryId(null)
  }

  const handleCreateTeam = async () => {
    if (!team.trim()) return

    const newTeamName = team.trim()

    await addDoc(teamsRef, {
      name: newTeamName,
    })

    setSelectedTeam(newTeamName)
    setTeam("")
  }

  const allTimeTotals: Record<string, number> = {}

  entries.forEach((r) => {
    const v = r.minutes ?? 0
    allTimeTotals[r.team] = (allTimeTotals[r.team] || 0) + v
  })

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
      <div className="md:hidden px-4 py-3 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <h1 className="text-base font-semibold">Fitness Tracker</h1>
      </div>

      {/* MOBILE NAV */}
      <div className="md:hidden flex gap-2 px-4 py-3">
        <button
          onClick={() => setView("dashboard")}
          className={`flex-1 py-2 text-sm rounded ${
            view === "dashboard" ? "bg-[#2f6f73]" : "bg-[#2a2a2a]"
          }`}
        >
          Track
        </button>

        <button
          onClick={() => setView("teams")}
          className={`flex-1 py-2 text-sm rounded ${
            view === "teams" ? "bg-[#2f6f73]" : "bg-[#2a2a2a]"
          }`}
        >
          Teams
        </button>
      </div>

      {/* SIDEBAR */}
      <div className="hidden md:flex w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] p-5 flex-col">
        <h1 className="text-xl font-semibold mb-6">Fitness</h1>

        <div className="space-y-2 text-sm">
          <div
            onClick={() => setView("dashboard")}
            className={`px-3 py-2 rounded cursor-pointer ${
              view === "dashboard" ? "bg-[#2f6f73]" : "hover:bg-[#2a2a2a]"
            }`}
          >
            Track
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
      <div className="flex-1 px-4 md:px-6 py-4 md:py-6">

        {view === "dashboard" && (
          <>
            <h2 className="text-lg md:text-2xl font-semibold mb-3 md:mb-4">
              Track
            </h2>

            <div className="bg-[#1f1f1f] rounded-xl p-3 md:p-4 mb-3 md:mb-4">
              <select
                className="w-full p-2.5 md:p-3 text-sm md:text-base rounded bg-[#111] border border-[#333]"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Select Team</option>
                {teams.map((t) => (
                  <option key={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-[#1f1f1f] rounded-xl p-3 md:p-4 mb-3 md:mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <input
                  className="p-2.5 md:p-3 text-sm md:text-base rounded bg-[#111] border border-[#333]"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  className="p-2.5 md:p-3 text-sm md:text-base rounded bg-[#111] border border-[#333]"
                  placeholder="Minutes"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />

                <button
                  onClick={handleSubmit}
                  className="bg-[#c46a2d] rounded font-semibold py-2.5 md:py-3 text-sm md:text-base"
                >
                  Log
                </button>
              </div>

              {lastEntryId && (
                <div className="mt-2 md:mt-3 text-right">
                  <button className="text-xs md:text-sm text-[#c46a2d]">
                    Undo last entry
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {view === "teams" && (
          <>
            <h2 className="text-lg md:text-2xl font-semibold mb-3 md:mb-4">
              Teams
            </h2>

            <div className="bg-[#1f1f1f] rounded-xl p-3 md:p-4 mb-3 md:mb-4 flex gap-2">
              <input
                className="flex-1 p-2.5 md:p-3 text-sm md:text-base rounded bg-[#111] border border-[#333]"
                placeholder="New team name"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              />
              <button
                onClick={handleCreateTeam}
                className="bg-[#c46a2d] px-3 md:px-4 text-sm md:text-base rounded"
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
                    className="flex justify-between px-4 py-2.5 md:py-3 border-b border-[#2a2a2a]"
                  >
                    <span className="text-sm md:text-base">
                      {i + 1}. {teamName}
                    </span>
                    <span className="text-[#c46a2d] font-bold text-sm md:text-base">
                      {total} min
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* ACTIVITY */}
      <div className="w-full md:w-72 bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-[#2a2a2a] px-4 py-4">
        <h3 className="text-sm font-semibold mb-3 md:mb-4">
          Recent Activity
        </h3>

        {activity.map((a, i) => (
          <div key={i} className="mb-2.5 text-sm">
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