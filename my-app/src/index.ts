import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import  CourseRoutes from './courses/index.js'


const app = new Hono()

app.route('/api/courses', CourseRoutes)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
