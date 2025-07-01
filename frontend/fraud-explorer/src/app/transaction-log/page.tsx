'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import axios from 'axios'
import { Badge } from '@/components/ui/badge'

interface Rule {
  message: string
  severity: 'low' | 'medium' | 'high'
  ruleId?: string 
}

interface LogEntry {
  transactionId: string
  timestamp: string
  matchedRules: Rule[]
  isFraudulent: boolean
  riskScore: number
}

export default function DrillDownPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filterTx, setFilterTx] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLogs(1)
  }, [])

  async function loadLogs(pageToLoad: number) {
    try {
      setLoading(true)
      setError(null)
     // Use environment variable for API base URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await axios.get<{ entries: LogEntry[]; hasMore: boolean }>(
        `${baseUrl}/decision-logs?page=${pageToLoad}&tx=${filterTx}`
      )
      if (pageToLoad === 1) {
        setLogs(res.data.entries)
      } else {
        setLogs(prev => [...prev, ...res.data.entries])
      }
      setHasMore(res.data.hasMore)
      setPage(pageToLoad)
    } catch (error) {
      console.error('Error loading logs:', error)
      setError('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  function onFilterChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilterTx(e.target.value)
  }

  function applyFilter() {
    setPage(1)
    loadLogs(1)
  }

  const getRiskLabel = (score: number): { label: string; color: string } => {
    if (score >= 75) return { label: 'High', color: 'text-red-600' }
    if (score >= 40) return { label: 'Medium', color: 'text-yellow-700' }
    return { label: 'Low', color: 'text-green-700' }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold">🧾 Transaction log</h1>

      <div className="flex gap-2">
        <Input
          placeholder="🔍 Filter by full or partial transaction ID"
          value={filterTx}
          onChange={onFilterChange}
          disabled={loading}
        />
        <Button onClick={applyFilter} disabled={loading}>
          {loading ? 'Filtering...' : 'Apply'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {logs.map((log, idx) => {
          const risk = getRiskLabel(log.riskScore)
          return (
            <Card key={`${log.transactionId}-${idx}`} className="border">
              <CardHeader className="flex justify-between items-start">
                <CardTitle className="text-base">
                  Transaction ID:
                  <span className="ml-2 font-mono text-sm break-all text-blue-700">
                    {log.transactionId}
                  </span>
                </CardTitle>
                <div className="text-right space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </div>
                  <Badge
                    variant={log.isFraudulent ? 'destructive' : 'default'}
                    className={log.isFraudulent ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}
                  >
                    {log.isFraudulent ? 'FRAUDULENT' : 'CLEAN'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="font-medium">Risk Score:</div>
                  <div className={`font-bold ${risk.color}`}>
                    {log.riskScore}% ({risk.label})
                  </div>
                </div>

                {log.matchedRules.length > 0 ? (
                  <div>
                    <div className="text-sm font-medium mb-2 text-gray-700">Matched Rules:</div>
                    <ul className="space-y-2 text-sm">
                      {log.matchedRules.map((rule, i) => (
                        <li
                          key={i}
                          className="border rounded px-3 py-2 bg-gray-50"
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{rule.message}</div>
                            <Badge
                              className={`text-xs ${
                                rule.severity === 'high'
                                  ? 'bg-red-200 text-red-800'
                                  : rule.severity === 'medium'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {rule.severity.toUpperCase()}
                            </Badge>
                          </div>
                          {rule.ruleId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Rule ID: <span className="font-mono">{rule.ruleId}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No rules matched.</p>
                )}
              </CardContent>
            </Card>
          )
        })}

        {logs.length === 0 && !loading && !error && (
          <p className="text-center text-gray-500">No transactions found.</p>
        )}

        {loading && (
          <div className="text-center text-gray-500">Loading...</div>
        )}

        {hasMore && !loading && (
          <div className="text-center">
            <Button onClick={() => loadLogs(page + 1)}>Load More</Button>
          </div>
        )}
      </div>
    </div>
  )
}
