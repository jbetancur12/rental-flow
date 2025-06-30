import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// Mock data storage (replace with actual database)
let properties: any[] = []
let contracts: any[] = []
let payments: any[] = []
let maintenanceRequests: any[] = []
let tenants: any[] = []

// Properties routes
app.get('/api/properties', (req, res) => {
  res.json(properties)
})

app.post('/api/properties', (req, res) => {
  const property = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  properties.push(property)
  
  // Emit real-time update
  io.emit('property_created', property)
  
  res.status(201).json(property)
})

app.put('/api/properties/:id', (req, res) => {
  const id = req.params.id
  const index = properties.findIndex(p => p.id === id)
  
  if (index === -1) {
    return res.status(404).json({ error: 'Property not found' })
  }
  
  properties[index] = {
    ...properties[index],
    ...req.body,
    updated_at: new Date().toISOString()
  }
  
  // Emit real-time update
  io.emit('property_updated', properties[index])
  
  res.json(properties[index])
})

// Contracts routes
app.get('/api/contracts', (req, res) => {
  res.json(contracts)
})

app.post('/api/contracts', (req, res) => {
  const contract = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  contracts.push(contract)
  
  // Emit real-time update
  io.emit('contract_created', contract)
  
  res.status(201).json(contract)
})

// Payments routes
app.get('/api/payments', (req, res) => {
  res.json(payments)
})

app.post('/api/payments', (req, res) => {
  const payment = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  payments.push(payment)
  
  // Emit real-time update
  io.emit('payment_created', payment)
  
  res.status(201).json(payment)
})

// Maintenance routes
app.get('/api/maintenance', (req, res) => {
  res.json(maintenanceRequests)
})

app.post('/api/maintenance', (req, res) => {
  const request = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  maintenanceRequests.push(request)
  
  // Emit real-time update
  io.emit('maintenance_created', request)
  
  res.status(201).json(request)
})

// Tenants routes
app.get('/api/tenants', (req, res) => {
  res.json(tenants)
})

app.post('/api/tenants', (req, res) => {
  const tenant = {
    id: Date.now().toString(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  tenants.push(tenant)
  
  // Emit real-time update
  io.emit('tenant_created', tenant)
  
  res.status(201).json(tenant)
})

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {
    total_properties: properties.length,
    occupied_properties: properties.filter(p => p.status === 'RENTED').length,
    available_properties: properties.filter(p => p.status === 'AVAILABLE').length,
    maintenance_properties: properties.filter(p => p.status === 'MAINTENACE').length,
    total_revenue: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
    pending_payments: payments.filter(p => p.status === 'PENDING').length,
    overdue_payments: payments.filter(p => p.status === 'OVERDUE').length,
    active_contracts: contracts.filter(c => c.status === 'ACTIVE').length,
    expiring_contracts: contracts.filter(c => {
      const endDate = new Date(c.end_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return endDate <= thirtyDaysFromNow && c.status === 'ACTIVE'
    }).length,
    open_maintenance: maintenanceRequests.filter(r => r.status === 'OPEN').length
  }
  
  res.json(stats)
})

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
  
  // Join specific rooms for targeted updates
  socket.on('join_property', (propertyId) => {
    socket.join(`property_${propertyId}`)
  })
  
  socket.on('join_contract', (contractId) => {
    socket.join(`contract_${contractId}`)
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})