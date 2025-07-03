"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { PlayerNameLookup } from "@/types/player-lookup"
import { Search, Check, X, Edit, Trash2, RefreshCw } from "lucide-react"

export default function PlayerMatchingPage() {
  const [lookups, setLookups] = useState<PlayerNameLookup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'manual_review' | 'matched' | 'no_match'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    matched_name: '',
    player_id: '',
    confidence_score: 0
  })

  useEffect(() => {
    fetchLookups()
  }, [filter])

  const fetchLookups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.set('status', filter)
      }
      if (filter === 'pending' || filter === 'manual_review') {
        params.set('needs_review', 'true')
      }

      const response = await fetch(`/api/player-name-lookup?${params}`)
      if (!response.ok) throw new Error('Failed to fetch lookups')
      
      const { data } = await response.json()
      setLookups(data || [])
    } catch (error) {
      console.error('Error fetching lookups:', error)
      toast.error('Failed to fetch player lookups')
    } finally {
      setLoading(false)
    }
  }

  const updateLookup = async (id: string, updates: Partial<PlayerNameLookup>) => {
    try {
      const response = await fetch(`/api/player-name-lookup?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) throw new Error('Failed to update lookup')

      await fetchLookups()
      toast.success('Player lookup updated successfully')
    } catch (error) {
      console.error('Error updating lookup:', error)
      toast.error('Failed to update player lookup')
    }
  }

  const handleEdit = (lookup: PlayerNameLookup) => {
    setEditingId(lookup.id)
    setEditForm({
      matched_name: lookup.matched_name || '',
      player_id: lookup.player_id?.toString() || '',
      confidence_score: lookup.confidence_score
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    const updates = {
      matched_name: editForm.matched_name || null,
      player_id: editForm.player_id ? parseInt(editForm.player_id) : null,
      confidence_score: editForm.confidence_score,
      match_status: editForm.matched_name ? 'matched' : 'no_match'
    }

    await updateLookup(editingId, updates)
    setEditingId(null)
  }

  const handleQuickAction = async (lookup: PlayerNameLookup, action: 'approve' | 'reject') => {
    const updates = action === 'approve' 
      ? { match_status: 'matched' as const }
      : { match_status: 'no_match' as const, matched_name: null, player_id: null }

    await updateLookup(lookup.id, updates)
  }

  const filteredLookups = lookups.filter(lookup => 
    lookup.odds_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lookup.matched_name && lookup.matched_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusBadge = (status: string, confidence: number) => {
    switch (status) {
      case 'matched':
        return <Badge variant="default" className="bg-green-100 text-green-800">Matched</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'manual_review':
        return <Badge variant="outline" className="border-orange-200 text-orange-800">Needs Review</Badge>
      case 'no_match':
        return <Badge variant="destructive">No Match</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Player Name Matching</h1>
        <p className="text-muted-foreground">
          Manage player name mappings between odds API and hit rate database
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {lookups.filter(l => l.match_status === 'matched').length}
            </div>
            <p className="text-sm text-muted-foreground">Matched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {lookups.filter(l => l.match_status === 'pending' || l.match_status === 'manual_review').length}
            </div>
            <p className="text-sm text-muted-foreground">Needs Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {lookups.filter(l => l.match_status === 'no_match').length}
            </div>
            <p className="text-sm text-muted-foreground">No Match</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {lookups.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by odds name or matched name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entries</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="manual_review">Needs Review</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="no_match">No Match</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchLookups} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Player Name Lookups ({filteredLookups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Odds Name</TableHead>
                  <TableHead>Matched Name</TableHead>
                  <TableHead>Player ID</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLookups.map((lookup) => (
                  <TableRow key={lookup.id}>
                    <TableCell className="font-medium">{lookup.odds_name}</TableCell>
                    <TableCell>
                      {editingId === lookup.id ? (
                        <Input
                          value={editForm.matched_name}
                          onChange={(e) => setEditForm({...editForm, matched_name: e.target.value})}
                          placeholder="Enter matched name..."
                        />
                      ) : (
                        lookup.matched_name || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === lookup.id ? (
                        <Input
                          value={editForm.player_id}
                          onChange={(e) => setEditForm({...editForm, player_id: e.target.value})}
                          placeholder="Player ID..."
                          type="number"
                        />
                      ) : (
                        lookup.player_id || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={getConfidenceColor(lookup.confidence_score)}>
                        {lookup.confidence_score}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lookup.match_status, lookup.confidence_score)}
                    </TableCell>
                    <TableCell>
                      {new Date(lookup.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === lookup.id ? (
                          <>
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(lookup)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {(lookup.match_status === 'pending' || lookup.match_status === 'manual_review') && lookup.matched_name && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleQuickAction(lookup, 'approve')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark as No Match</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will mark "{lookup.odds_name}" as having no match in our database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleQuickAction(lookup, 'reject')}>
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 