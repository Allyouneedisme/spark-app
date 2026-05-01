import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { goal, days } = await request.json()

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model:      "llama-3.1-8b-instant",
        max_tokens: 2000,
        messages: [{
          role:    "user",
          content: `You are a task planning assistant for students.
The student wants to: "${goal}"
They have ${days} days to complete it.
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
]`
        }]
      })
    }
  )

  const data   = await response.json()
  const text   = data.choices[0].message.content
  const clean  = text.replace(/```json|```/g, "").trim()
  const tasks  = JSON.parse(clean)

  // Fetch YouTube video for each task
  const tasksWithVideos = await Promise.all(
    tasks.map(async (task: any) => {
      try {
        const ytResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(task.youtube_query)}&type=video&key=${process.env.YOUTUBE_API_KEY}`
        )
        const ytData = await ytResponse.json()
        if (ytData.items && ytData.items.length > 0) {
          const video = ytData.items[0]
          task.youtube = {
            title:     video.snippet.title,
            url:       `https://www.youtube.com/watch?v=${video.id.videoId}`,
            thumbnail: video.snippet.thumbnails.medium.url,
            channel:   video.snippet.channelTitle,
          }
        }
      } catch(e) {
        task.youtube = null
      }
      return task
    })
  )

  return NextResponse.json({ tasks: tasksWithVideos })
} 