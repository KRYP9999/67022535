import { Hono } from 'hono'
import { z } from 'zod'
import db from "../db/index";

const CourseSchema = z.object({
  CourseID: z.string().min(1),
  CourseName: z.string().min(1),
  Credits: z.number().int().positive(),
  Description: z.string().default(''),
  Semester: z.number().int().positive()
})

const CourseUpdateSchema = CourseSchema.partial().omit({ CourseID: true })
type Course = z.infer<typeof CourseSchema>

const courses = new Map<string, Course>()

const CourseRoutes = new Hono()

CourseRoutes.get('/', (c) => c.text('Course API (Hono + Node)'))

CourseRoutes.post('/api/v1/courses', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = CourseSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const course = parsed.data
  if (courses.has(course.CourseID)) return c.json({ error: 'CourseID already exists' }, 409)

  courses.set(course.CourseID, course)
  return c.json({ data: course }, 201)
})

CourseRoutes.get('/api/v1/courses', (c) => {
  const semesterParam = c.req.query('semester')
  let data = Array.from(courses.values())

  if (semesterParam) {
    const sem = Number(semesterParam)
    if (!Number.isInteger(sem)) return c.json({ error: 'semester must be integer' }, 400)
    data = data.filter((x) => x.Semester === sem)
  }
  return c.json({ data })
})

CourseRoutes.get('/api/v1/courses/:courseId', (c) => {
  const id = c.req.param('courseId')
  const course = courses.get(id)
  if (!course) return c.json({ error: 'NotFound' }, 404)
  return c.json({ data: course })
})

CourseRoutes.put('/api/v1/courses/:courseId', async (c) => {
  const id = c.req.param('courseId')
  if (!courses.has(id)) return c.json({ error: 'NotFound' }, 404)

  const body = await c.req.json().catch(() => null)
  const PutSchema = CourseSchema.omit({ CourseID: true })
  const parsed = PutSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const updated: Course = { CourseID: id, ...parsed.data }
  courses.set(id, updated)
  return c.json({ data: updated })
})

CourseRoutes.patch('/api/v1/courses/:courseId', async (c) => {
  const id = c.req.param('courseId')
  const existing = courses.get(id)
  if (!existing) return c.json({ error: 'NotFound' }, 404)

  const body = await c.req.json().catch(() => null)
  const parsed = CourseUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const updated = { ...existing, ...parsed.data, CourseID: id }
  courses.set(id, updated)
  return c.json({ data: updated })
})

CourseRoutes.delete('/api/v1/courses/:courseId', (c) => {
  const id = c.req.param('courseId')
  if (!courses.has(id)) return c.json({ error: 'NotFound' }, 404)
  courses.delete(id)
  return c.json({ message: 'deleted' })
})

export default  CourseRoutes;