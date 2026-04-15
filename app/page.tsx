"use client"

import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, onSnapshot } from "firebase/firestore"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Run = {
  team: string
  name: string
  miles: number
}

export default function Home() {
  const [team, setTeam] = useState("")
  const [name, setName] = useState("")
  const [miles, setMiles] = useState("")
  const [runs, setRuns] = useState<Run[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const runsRef = collection(db, "runs")

  // 🔥 REAL TIME
  useEffect(() => {
    const unsubscribe = onSnapshot(runsRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as Run)
      setRuns(data)

      const uniqueTeams = Array.from(new Set(data.map((r) => r.team)))
      setTeams(uniqueTeams)
    })

    return () => unsubscribe()
  }, [])

  // ➕ CREATE TEAM
  const handleCreateTeam = () => {
    if (!team.trim()) return
    if (!teams.includes(team)) setTeams([...teams, team])

    setSelectedTeam(team)
    setTeam("")
  }

  // 🏃 SUBMIT RUN (WITH ANIMATION)
  const handleSubmit = async () => {
    if (!selectedTeam || !name || !miles) return

    setIsSubmitting(true)

    await addDoc(runsRef, {
      team: selectedTeam,
      name,
      miles: Number(miles),
    })

    setName("")
    setMiles("")

    setIsSubmitting(false)

    // success animation
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 1500)
  }

  // 🧮 TOTALS
  const teamTotals: Record<string, number> = {}

  runs.forEach((r) => {
    teamTotals[r.team] = (teamTotals[r.team] || 0) + r.miles
  })

  // 📊 CHART
  const chartData = Object.entries(teamTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([team, miles]) => ({ team, miles }))

  // 👤 TEAM DETAIL
  const selectedTeamRuns = runs
    .filter((r) => r.team === selectedTeam)
    .sort((a, b) => b.miles - a.miles)

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">

      <div className="w-full max-w-md bg-white min-h-screen shadow-xl">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b p-4">
          <h1 className="text-xl font-bold text-gray-900">
            Team Fitness Tracker
          </h1>
          <p className="text-sm text-gray-700">
            Live team fitness dashboard
          </p>
        </div>

        {/* SUCCESS TOAST */}
        {showSuccess && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce z-50 text-sm">
            Run Logged ✔
          </div>
        )}

        <div className="p-4 space-y-4 pb-10">

          {/* TEAM */}
          <div className="border-2 border-sky-200 bg-sky-50 rounded-xl p-5 shadow-md">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Team Selection
            </h2>

            <select
              className="w-full p-3 border rounded-lg"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Select Team</option>
              {teams.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <div className="flex gap-2 mt-2">
              <input
                className="flex-1 p-2 border rounded-lg text-sm"
                placeholder="New team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              />
              <button
                onClick={handleCreateTeam}
                className="bg-sky-500 text-white px-3 rounded-lg text-sm shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* LOG RUN */}
          <div className="border-2 border-sky-200 bg-sky-50 rounded-xl p-5 shadow-md">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Log Your Run
            </h2>

            <div className="flex flex-col gap-2">

              <input
                className="p-3 border rounded-lg text-sm"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="p-3 border rounded-lg text-sm"
                type="number"
                placeholder="Miles"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
              />

              {/* 🔥 ANIMATED BUTTON */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`bg-sky-500 text-white py-3 rounded-lg font-bold shadow-md transition-all duration-200 active:scale-95 ${
                  isSubmitting ? "opacity-50 scale-95" : ""
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Run"}
              </button>

            </div>
          </div>

          {/* LEADERBOARD */}
          <div className="border rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 text-gray-900">
              Leaderboard
            </h2>

            <ul className="space-y-2">
              {Object.entries(teamTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([team, miles], i) => (
                  <li
                    key={team}
                    onClick={() =>
                      setSelectedTeam(selectedTeam === team ? "" : team)
                    }
                    className="flex justify-between text-sm p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <span className="text-gray-800">
                      #{i + 1} {team}
                    </span>
                    <span className="font-bold text-sky-600">
                      {miles} mi
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {/* CHART */}
          <div className="border rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 text-gray-900">
              Top Teams
            </h2>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="team" hide />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="miles" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TEAM DETAILS */}
          {selectedTeam && (
            <div className="border rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-2 text-gray-900">
                {selectedTeam} Contributions
              </h2>

              {selectedTeamRuns.map((r, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-gray-800">{r.name}</span>
                  <span className="font-bold text-sky-600">
                    {r.miles} mi
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}