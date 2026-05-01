import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { query } = await request.json()
  const apiKey = process.env.YOUTUBE_API_KEY

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query + " tutorial")}&type=video&key=${apiKey}`
    )
    const data = await response.json()

    if (data.items && data.items.length > 0) {
      const video = data.items[0]
      return NextResponse.json({
        title:     video.snippet.title,
        videoId:   video.id.videoId,
        url:       `https://www.youtube.com/watch?v=${video.id.videoId}`,
        thumbnail: video.snippet.thumbnails.medium.url,
        channel:   video.snippet.channelTitle,
      })
    }
    return NextResponse.json({ error: "No video found" })
  } catch(e) {
    return NextResponse.json({ error: "YouTube API error" })
  }
}