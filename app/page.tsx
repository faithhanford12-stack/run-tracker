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

  const handleCreateTeam = () => {
    if (!team.trim()) return
    if (!teams.includes(team)) setTeams([...teams, team])

    setSelectedTeam(team)
    setTeam("")
  }

  const handleSubmit = async () => {
    if (!selectedTeam || !name || !miles) return

    await addDoc(runsRef, {
      team: selectedTeam,
      name,
      miles: Number(miles),
    })

    setName("")
    setMiles("")
  }

  const teamTotals: Record<string, number> = {}

  runs.forEach((r) => {
    teamTotals[r.team] = (teamTotals[r.team] || 0) + r.miles
  })

  const chartData = Object.entries(teamTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([team, miles]) => ({ team, miles }))

  const selectedTeamRuns = runs
    .filter((r) => r.team === selectedTeam)
    .sort((a, b) => b.miles - a.miles)

  // 🔵 INPUT STYLE (centralized fix)
  const inputStyle =
    "w-full p-3 border rounded-lg text-sky-950 font-medium placeholder:text-sky-950"

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b p-4">
          <h1 className="text-xl font-bold text-sky-950">
            🏃 Run Tracker
          </h1>
          <p className="text-sm text-sky-950">
            Live team fitness dashboard
          </p>
        </div>

        <div className="p-4 space-y-4 pb-10">

          {/* TEAM */}
          <div className={`border-2 rounded-xl p-5 shadow-md transition-all duration-200 ${
            selectedTeam ? "border-sky-400 bg-sky-50" : "border-sky-200 bg-sky-50"
          }`}>
            <h2 className="text-sm font-semibold text-sky-950 mb-2">
              Team Selection
            </h2>

            <select
              className={`${inputStyle}`}
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="" className="text-sky-950">
                Select Team
              </option>
              {teams.map((t) => (
                <option key={t} className="text-sky-950">
                  {t}
                </option>
              ))}
            </select>

            <div className="flex gap-2 mt-2">
              <input
                className={`${inputStyle}`}
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
            <h2 className="text-sm font-semibold text-sky-950 mb-3">
              Log Your Run
            </h2>

            <div className="flex flex-col gap-2">

              <input
                className={`${inputStyle}`}
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className={`${inputStyle}`}
                type="number"
                placeholder="Miles"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
              />

              <button
                onClick={handleSubmit}
                className="bg-sky-500 text-white py-3 rounded-lg font-bold shadow-md active:scale-95"
              >
                Submit Run
              </button>
            </div>
          </div>

          {/* LEADERBOARD */}
          <div className="border rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 text-sky-950">
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
                    className={`flex justify-between text-sm p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedTeam === team
                        ? "bg-sky-100 border border-sky-400 shadow-sm"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-sky-950">
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
            <h2 className="text-sm font-semibold mb-3 text-sky-950">
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
              <h2 className="text-sm font-semibold mb-2 text-sky-950">
                {selectedTeam} Contributions
              </h2>

              {selectedTeamRuns.map((r, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-sky-950">{r.name}</span>
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