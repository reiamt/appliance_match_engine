"use client";

import { useState } from "react";
import { startSession, resumeSession } from "../lib/api";
import type { SessionResponse, DeviceFromDb } from "../types/device";

type AppPhase = "upload" | "processing" | "selecting" | "completed";

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("upload");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [data, setData] = useState<SessionResponse | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null)
    setPhase("processing");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const result = await startSession(formData);
      setSessionId(result.sessionId ?? null);
      setData(result);

      if (result.status === "interrupted") {
        setPhase("selecting");
      } else {
        setPhase("completed");
      }
    } catch (err) {
      setError(String(err));
      setPhase("upload");
    }
  }

  async function handleSelect() {
    if (!sessionId || selectedId === null) return;
    setError(null)
    setPhase("processing");

    try {
      const result = await resumeSession(sessionId, selectedId);
      setData(result);
      setSelectedId(null);

      if (result.status === "interrupted") {
        setPhase("selecting");
      } else {
        setPhase("completed");
      }
    } catch (err) {
      setError(String(err));
      setPhase("selecting");
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Appliance Match Engine</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      {phase === "upload" && (
        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">PDF Upload</label>
            <input type="file" name="pdf" accept=".pdf" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Mode</label>
            <select name="pdfToFill" className="border rounded p-2">
              <option value="true">Fill PDF (lookup devices)</option>
              <option value="false">Save devices to DB</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">LLM Calls</label>
            <select name="enableLlmCalls" className="border rounded p-2">
              <option value="false">Use cached data</option>
              <option value="true">Enable LLM calls</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Start Process
          </button>
        </form>
      )}

      {phase === "processing" && (
        <p className="text-gray-600">Processing...</p>
      )}

      {phase === "selecting" && data && (
        <div className="space-y-4">
          <p className="font-medium">
            Device {data.currentDeviceIndex! + 1} of {data.totalDevices}:{" "}
            <span className="text-blue-600">
              {data.deviceBeingMatched?.device_raw}
            </span>
          </p>

          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Type</th>
                <th className="border p-2 text-left">L x W x H</th>
                <th className="border p-2 text-left">Manufacturer</th>
                <th className="border p-2 text-left">Model</th>
                <th className="border p-2 text-left">Price</th>
              </tr>
            </thead>
            <tbody>
              {data.availableDevices?.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`cursor-pointer hover:bg-blue-50 ${
                    selectedId === d.id ? "bg-blue-100" : ""
                  }`}
                >
                  <td className="border p-2">{d.id}</td>
                  <td className="border p-2">{d.device_raw}</td>
                  <td className="border p-2">
                    {d.length} x {d.width} x {d.height}
                  </td>
                  <td className="border p-2">{d.manufacturer}</td>
                  <td className="border p-2">{d.model}</td>
                  <td className="border p-2">{d.price} EUR</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSelect}
            disabled={selectedId === null}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            Confirm Selection
          </button>
        </div>
      )}

      {phase === "completed" && (
        <div className="space-y-4">
          <p className="text-green-600 font-medium">All devices processed!</p>
          <p>Selected {data?.selectedDevices?.length ?? 0} devices.</p>
        </div>
      )}
    </main>
  );
}