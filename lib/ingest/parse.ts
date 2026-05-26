import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export interface RawTranscriptChunk {
  courseId: string
  courseTitle: string
  lessonId: string
  lessonTitle: string
  text: string
}

interface CourseDetails {
  data: {
    id: number
    title: string
  }
}

interface LessonDetails {
  id: number
  title: string
}

function stripVtt(vtt: string): string {
  return vtt
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'WEBVTT') return false
      if (/^\d+$/.test(trimmed)) return false
      if (/^\d{2}:\d{2}:\d{2}/.test(trimmed)) return false
      return true
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function parseTranscripts(dataDir: string): Promise<RawTranscriptChunk[]> {
  const chunks: RawTranscriptChunk[] = []
  const courseDirs = await readdir(dataDir)

  for (const courseDir of courseDirs) {
    const coursePath = join(dataDir, courseDir)

    let courseTitle = courseDir
    try {
      const detailsRaw = await readFile(join(coursePath, 'details.json'), 'utf-8')
      const details = JSON.parse(detailsRaw) as CourseDetails
      courseTitle = details.data?.title ?? courseDir
    } catch {
      // keep courseDir as fallback
    }

    const lessonsPath = join(coursePath, 'lessons')
    let lessonDirs: string[]
    try {
      lessonDirs = await readdir(lessonsPath)
    } catch {
      continue
    }

    for (const lessonDir of lessonDirs) {
      const lessonPath = join(lessonsPath, lessonDir)
      const vttPath = join(lessonPath, 'subtitle_pt-BR.vtt')

      let vttContent: string
      try {
        vttContent = await readFile(vttPath, 'utf-8')
      } catch {
        continue
      }

      const text = stripVtt(vttContent)
      if (!text || text.length < 50) continue

      let lessonId = lessonDir
      let lessonTitle = `Aula ${lessonDir}`
      try {
        const lessonRaw = await readFile(join(lessonPath, 'details.json'), 'utf-8')
        const lessonDetails = JSON.parse(lessonRaw) as LessonDetails
        lessonId = String(lessonDetails.id ?? lessonDir)
        lessonTitle = lessonDetails.title ?? lessonTitle
      } catch {
        // keep defaults
      }

      chunks.push({
        courseId: courseDir,
        courseTitle,
        lessonId,
        lessonTitle,
        text,
      })
    }
  }

  return chunks
}
