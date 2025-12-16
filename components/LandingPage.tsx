"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

/* =======================
   Types
======================= */
type Documentation = {
  overview: string;
  flow: string[];
  functions: {
    name: string;
    responsibility: string;
  }[];
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    tooling: string[];
  };
  setup: string[];
};

/* =======================
   Reusable Section
======================= */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="text-gray-700 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/* =======================
   Main Component
======================= */
function LandingPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<Documentation | null>(null);

  async function handleGenerate() {
    if (!url) return;

    setLoading(true);
    setOutput(null);

    try {
      const res = await fetch("/api/generate-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("API Error:", err);
        alert(err.error || "API Error");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOutput(data.documentation);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while generating documentation.");
    } finally {
      setLoading(false);
    }
  }

  function copyOutput() {
    if (!output) return;

    const text = `
# Documentation

## Overview
${output.overview}

## Project Flow
${output.flow.map((f, i) => `${i + 1}. ${f}`).join("\n")}

## Key Functions
${output.functions.map((fn) => `- ${fn.name}: ${fn.responsibility}`).join("\n")}

## Tech Stack
${Object.entries(output.techStack)
  .map(([key, values]) =>
    values.length ? `- ${key}: ${values.join(", ")}` : null
  )
  .filter(Boolean)
  .join("\n")}

## Setup
${output.setup.map((s, i) => `${i + 1}. ${s}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#ebebed] py-10 px-4">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-3 text-gray-800">
        Generate Documentation
      </h1>
      <p className="text-gray-500 mb-10">
        Paste your GitHub repository URL to generate clean documentation.
      </p>

      {/* Input */}
      <div className="shadow-md rounded-xl p-5 flex flex-row items-center w-full max-w-2xl">
        <input
          type="text"
          placeholder="Paste GitHub Repository URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-[80%] border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 transition text-white px-6 py-3 rounded-lg font-semibold shadow-md ml-4 text-sm"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="mt-12 w-full max-w-3xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Generated Documentation
            </h2>

            <button
              onClick={copyOutput}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 transition px-3 py-2 rounded-md"
            >
              <Copy size={18} />
              Copy
            </button>
          </div>

          <div className="bg-white shadow-md rounded-xl p-8">
            <Section title="Overview">
              <p>{output.overview}</p>
            </Section>

            <Section title="Project Flow">
              <ol className="list-decimal pl-5 space-y-1">
                {output.flow.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </Section>

            <Section title="Key Functions">
              <ul className="space-y-2">
                {output.functions.map((fn, i) => (
                  <li key={i}>
                    <span className="font-medium">{fn.name}:</span>{" "}
                    {fn.responsibility}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Tech Stack">
              <ul className="space-y-1">
                {Object.entries(output.techStack).map(([key, values]) =>
                  values.length ? (
                    <li key={key}>
                      <span className="capitalize font-medium">{key}:</span>{" "}
                      {values.join(", ")}
                    </li>
                  ) : null
                )}
              </ul>
            </Section>

            <Section title="Setup">
              <ol className="list-decimal pl-5 space-y-1">
                {output.setup.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
