'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { formatCurrency, formatDate, getRiskColor, getSeverityColor } from '@/lib/utils'


// interfaces

interface Transaction {
  id: string
  userId: string
  amount: number
  currency: string
  merchantId: string
  merchantCategory: string
  location: { city: string; state: string }
  timestamp: string
  paymentMethod: string
  ipAddress: string
  deviceFingerprint: string
}

interface RuleMatch {
  ruleId: string
  type: string
  message: string
  severity: 'low' | 'medium' | 'high'
}

interface TransactionAnalysis {
  transactionId: string
  timestamp: string
  matchedRules: RuleMatch[]
  isFraudulent: boolean
  riskScore: number
}

interface TransactionEvent {
  transaction: Transaction
  analysis: TransactionAnalysis
}

export function TransactionFeed() {
  const [transactions, setTransactions] = useState<TransactionEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [filter, setFilter] = useState<'all' | 'fraudulent' | 'clean'>('all')
  const [selectedTx, setSelectedTx] = useState<TransactionEvent | null>(null)
  const [selectedRuleId, setSelectedRuleId] = useState('')
  const [ruleMap, setRuleMap] = useState<Map<string, string>>(new Map())

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    connectWebSocket()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const connectWebSocket = () => {
    const wsUrl = 'https://fraud-backend-7vvy.onrender.com/ws'
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      setIsConnected(true)
      wsRef.current?.send(JSON.stringify({ type: 'get_status' }))
    }

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'transaction': {
          const newTx: TransactionEvent = data.data

          setTransactions(prev => {
            const exists = prev.some(tx => tx.transaction.id === newTx.transaction.id)
            if (exists) return prev
            return [newTx, ...prev].slice(0, 100)
          })

          
          setRuleMap(prevMap => {
            const updated = new Map(prevMap)
            newTx.analysis.matchedRules.forEach(rule => {
              if (!updated.has(rule.ruleId)) {
                updated.set(rule.ruleId, rule.message)
              }
            })
            return updated
          })

          if (!simulationRunning) setSimulationRunning(true)
          break
        }

        case 'simulation_status':
          setSimulationRunning(data.running)
          break

        case 'status':
          setSimulationRunning(data.simulation_running)
          break
      }
    }

    wsRef.current.onclose = () => {
      setIsConnected(false)
      setSimulationRunning(false)
      setTimeout(() => connectWebSocket(), 3000)
    }

    wsRef.current.onerror = () => setIsConnected(false)
  }

  const toggleSimulation = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: simulationRunning ? 'stop_simulation' : 'start_simulation'
      }))
    }
  }

  const filteredTransactions = transactions.filter(event => {
    const ruleMatch =
      selectedRuleId === '' ||
      event.analysis.matchedRules.some(r => r.ruleId === selectedRuleId)

    const fraudFilter =
      filter === 'fraudulent'
        ? event.analysis.isFraudulent
        : filter === 'clean'
        ? !event.analysis.isFraudulent
        : true

    return ruleMatch && fraudFilter
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Live Transaction Feed</span>
            <div className="flex space-x-2">
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Badge variant={simulationRunning ? 'default' : 'secondary'}>
                {simulationRunning ? 'Running' : 'Stopped'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ruleMap.size > 0 && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mr-2">Filter by Rule:</label>
              <select
                value={selectedRuleId}
                onChange={e => setSelectedRuleId(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="">All Rules</option>
                {Array.from(ruleMap.entries()).map(([ruleId, message]) => (
                  <option key={ruleId} value={ruleId}>
                    {message} ({ruleId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-between mb-4">
            <div className="flex space-x-2">
              <Button onClick={toggleSimulation} variant={simulationRunning ? 'destructive' : 'default'}>
                {simulationRunning ? 'Stop Simulation' : 'Start Simulation'}
              </Button>
             
            </div>
            <div className="flex space-x-2">
              {['all', 'fraudulent', 'clean'].map(f => (
                <Button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({transactions.filter(t =>
                    f === 'all' ? true : f === 'fraudulent' ? t.analysis.isFraudulent : !t.analysis.isFraudulent
                  ).length})
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredTransactions.map((event, idx) => (
              <div
                key={`${event.transaction.id}-${idx}`}
                className={`border rounded p-4 cursor-pointer hover:shadow-md transition ${
                  event.analysis.isFraudulent ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedTx(event)}
              >
                <div className="flex justify-between mb-1">
                  <div className="font-mono text-sm text-gray-700">{event.transaction.id}</div>
                  <div className={`font-semibold ${getRiskColor(event.analysis.riskScore)}`}>
                    Risk: {event.analysis.riskScore}%
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>Amount: <strong>{formatCurrency(event.transaction.amount, event.transaction.currency)}</strong></div>
                  <div>Merchant: <strong>{event.transaction.merchantId}</strong></div>
                  <div>Location: <strong>{event.transaction.location.city}, {event.transaction.location.state}</strong></div>
                  <div>Time: <strong>{formatDate(event.transaction.timestamp)}</strong></div>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No {filter !== 'all' ? filter : ''} transactions to show.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drill-Down Modal */}
      {selectedTx && (
        <Dialog open={true} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transaction Detail</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><span className="text-gray-600">Transaction ID:</span><div className="font-mono">{selectedTx.transaction.id}</div></div>
                <div><span className="text-gray-600">User ID:</span><div>{selectedTx.transaction.userId}</div></div>
                <div><span className="text-gray-600">Time:</span><div>{formatDate(selectedTx.transaction.timestamp)}</div></div>
                <div><span className="text-gray-600">Amount:</span><div>{formatCurrency(selectedTx.transaction.amount, selectedTx.transaction.currency)}</div></div>
                <div><span className="text-gray-600">Merchant:</span><div>{selectedTx.transaction.merchantId}</div></div>
                <div><span className="text-gray-600">Location:</span><div>{selectedTx.transaction.location.city}, {selectedTx.transaction.location.state}</div></div>
                <div><span className="text-gray-600">Payment Method:</span><div>{selectedTx.transaction.paymentMethod}</div></div>
                <div><span className="text-gray-600">IP Address:</span><div>{selectedTx.transaction.ipAddress}</div></div>
                <div><span className="text-gray-600">Device:</span><div>{selectedTx.transaction.deviceFingerprint}</div></div>
              </div>

              <div className="border-t pt-4">
                <div className="mb-2 text-gray-600">Rules Triggered ({selectedTx.analysis.matchedRules.length}):</div>
                {selectedTx.analysis.matchedRules.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTx.analysis.matchedRules.map((rule, idx) => (
                      <div key={idx} className="border rounded p-2">
                        <div className="flex justify-between">
                          <div><strong>{idx + 1}. {rule.message}</strong></div>
                          <Badge variant={getSeverityColor(rule.severity) as any}>{rule.severity.toUpperCase()}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Rule ID: {rule.ruleId}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No rules matched</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
