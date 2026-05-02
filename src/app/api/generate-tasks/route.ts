import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { goal, days, skillContext } = body as {
      goal?: string
      days?: number
      skillContext?: string
    }

    if (!goal?.trim()) {
      return NextResponse.json(
        { error: "Missing goal" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Server misconfiguration: GROQ_API_KEY is not set. Add it to .env.local.",
        },
        { status: 503 }
      )
    }

    const skillsLine =
      typeof skillContext === "string" && skillContext.trim()
        ? `${skillContext.trim()}\n`
        : ""

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `You are a task planning assistant for students.
${skillsLine}The student wants to: "${goal}"
They have ${days ?? 30} days to complete it.
Generate exactly 8 specific tasks.
For each task also provide a youtube_search_query to find the best tutorial.
Reply ONLY with a JSON array. No extra text. No markdown:
[
  {
    "title": "Task name",
    "description": "One sentence detail",
    "deadline": "Day 3",
    "youtube_query": "best youtube search query for this topic",
    "doc_link": "https://relevant-documentation-link.com",
    "difficulty": "Easy/Medium/Hard"
  }
]`,
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      const msg =
        typeof data?.error?.message === "string"
          ? data.error.message
          : response.statusText || "Groq request failed"
      return NextResponse.json(
        { error: msg },
        { status: response.status >= 500 ? 502 : response.status }
      )
    }

    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Unexpected response from task generator" },
        { status: 502 }
      )
    }

    const clean = content.replace(/```json|```/g, "").trim()
    let tasks: unknown
    try {
      tasks = JSON.parse(clean)
    } catch {
      return NextResponse.json(
        { error: "Could not parse generated tasks. Try again." },
        { status: 502 }
      )
    }

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Generated output was not a task list" },
        { status: 502 }
      )
    }

    const ytKey = process.env.YOUTUBE_API_KEY

    // Fetch YouTube video for each task
    const tasksWithVideos = await Promise.all(
      (tasks as any[]).map(async (task: any) => {
        try {
          if (!ytKey || typeof task.youtube_query !== "string") {
            task.youtube = null
            return task
          }
          const ytResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(task.youtube_query)}&type=video&key=${ytKey}`
          )
          const ytData = await ytResponse.json()
          if (ytData.items && ytData.items.length > 0) {
            const video = ytData.items[0]
            task.youtube = {
              title: video.snippet.title,
              url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
              thumbnail: video.snippet.thumbnails.medium.url,
              channel: video.snippet.channelTitle,
            }
          }
        } catch {
          task.youtube = null
        }
        return task
      })
    )

    return NextResponse.json({ tasks: tasksWithVideos })
  } catch (e) {
    console.error("generate-tasks:", e)
    return NextResponse.json(
      { error: "Failed to generate tasks" },
      { status: 500 }
    )
  }
}