'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit2, Plus } from 'lucide-react'
import axios from 'axios'

//interface

interface Rule {
  id: string
  name: string
  description: string
  active: boolean
  conditions: any
  event: { type: string; params: { message: string; severity: string; rule_id: string } }
}

export default function RuleComposerPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [conditions, setConditions] = useState('{}')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low')

  useEffect(() => {
    fetchRules()
  }, [])

  async function fetchRules() {
    const res = await axios.get<Rule[]>('/api/rules')
    setRules(res.data)
  }
  function openNew() {
    setEditingRule(null)
    setName(''); setDescription(''); setConditions('{}'); setMessage(''); setSeverity('low')
    setDialogOpen(true)
  }
  function openEdit(rule: Rule) {
    setEditingRule(rule)
    setName(rule.name)
    setDescription(rule.description)
    setConditions(JSON.stringify(rule.conditions, null, 2))
    setMessage(rule.event.params.message)
    setSeverity(rule.event.params.severity as any)
    setDialogOpen(true)
  }
  async function saveRule() {
    const payload = {
      name,
      description,
      conditions: JSON.parse(conditions),
      event: { type: 'fraud_alert', params: { message, severity, rule_id: editingRule?.event.params.rule_id } }
    }
    if (editingRule) {
      await axios.put(`/api/rules/${editingRule.id}`, payload)
    } else {
      await axios.post('/api/rules', payload)
    }
    setDialogOpen(false)
    fetchRules()
  }

  async function toggleRule(id: string) {
    await axios.patch(`/api/rules/${id}/toggle`)
    fetchRules()
  }
  async function deleteRule(id: string) {
    if (confirm('Deactivate this rule?')) {
      await axios.delete(`/api/rules/${id}`)
      fetchRules()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rule Composer</h1>
        <Button variant="default" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Rule
        </Button>
      </div>

      {rules.map(rule => (
        <Card key={rule.id}>
          <CardHeader className="flex justify-between items-center">
            <div>
              <CardTitle>{rule.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={rule.active ? 'default' : 'outline'}>
                {rule.active ? 'Active' : 'Inactive'}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => deleteRule(rule.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => toggleRule(rule.id)}>
                {rule.active ? '❌' : '✅'}
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
         
          <div />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'New Rule'}</DialogTitle>
            <DialogDescription>
              Define rule conditions as JSON and configure the alert message/severity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium">Conditions (JSON)</label>
              <Textarea
                className="font-mono text-xs"
                value={conditions}
                onChange={e => setConditions(e.target.value)}
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Alert Message</label>
                <Input value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Severity</label>
                <select
                  className="mt-1 block w-full rounded-md border px-3 py-2"
                  value={severity}
                  onChange={e => setSeverity(e.target.value as any)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRule}>{editingRule ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
