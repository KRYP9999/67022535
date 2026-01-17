import { Hono } from 'hono'
import { z } from 'zod'
import db from '../db/index.js'

const CourseRoutes = new Hono()

type Course = {
  CourseID: number
  CourseName: string
  Credits: number
  Description: string
  Semester: number
}

const CourseCreateSchema = z.object({
  CourseName: z.string().min(1),
  Credits: z.number().int().positive(),
  Description: z.string().optional(),
  Semester: z.number().int().positive()
})

const CourseUpdateSchema = CourseCreateSchema.partial()

CourseRoutes.get('/', (c) => {
  const stmt = db.prepare<[], Course>('SELECT * FROM Courses')
  const courses = stmt.all()

  return c.json({
    message: 'list of courses',
    data: courses
  })
})

CourseRoutes.get('/:id', (c) => {
  const id = Number(c.req.param('id'))

  const stmt = db.prepare<[number], Course>(
    'SELECT * FROM Courses WHERE CourseID = ?'
  )
  const course = stmt.get(id)

  if (!course) {
    return c.json({ message: 'course not found' }, 404)
  }

  return c.json(course)
})

CourseRoutes.post('/', async (c) => {
  const body = await c.req.json()

  const parsed = CourseCreateSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ errors: parsed.error.format() }, 400)
  }

  const { CourseName, Credits, Description, Semester } = parsed.data

  const stmt = db.prepare(`
    INSERT INTO Courses (CourseName, Credits, Description, Semester)
    VALUES (?, ?, ?, ?)
  `)

  const result = stmt.run(
    CourseName,
    Credits,
    Description ?? '',
    Semester
  )

  return c.json(
    {
      message: 'course created',
      CourseID: result.lastInsertRowid
    },
    201
  )
})

CourseRoutes.put('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json()

  const parsed = CourseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ errors: parsed.error.format() }, 400)
  }

  const fields = parsed.data
  const keys = Object.keys(fields)

  if (keys.length === 0) {
    return c.json({ message: 'no fields to update' }, 400)
  }

  const setClause = keys.map((k) => `${k} = ?`).join(', ')
  const values = [...Object.values(fields), id]

  const stmt = db.prepare(
    `UPDATE Courses SET ${setClause} WHERE CourseID = ?`
  )

  const result = stmt.run(...values)

  if (result.changes === 0) {
    return c.json({ message: 'course not found' }, 404)
  }

  return c.json({ message: 'course updated' })
})

CourseRoutes.delete('/:id', (c) => {
  const id = Number(c.req.param('id'))

  const stmt = db.prepare(
    'DELETE FROM Courses WHERE CourseID = ?'
  )
  const result = stmt.run(id)

  if (result.changes === 0) {
    return c.json({ message: 'course not found' }, 404)
  }

  return c.json({ message: 'course deleted' })
})

export default CourseRoutes
