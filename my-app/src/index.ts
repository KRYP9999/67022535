import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import  CourseRoutes from './study/index.js'


const app = new Hono()

app.route('/api/study', CourseRoutes)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
