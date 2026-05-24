'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWeightHistory, logWeight } from '@/core/services/userService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts'

interface Props { userId: string; goalWeight?: number | null }

function toLocalDate() {
  return new Date().toLocaleDateString('fr-CA') // YYYY-MM-DD in local time
}

function formatDateShort(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export default function WeightTracker({ userId, goalWeight }: Props) {
  const queryClient = useQueryClient()
  const today = toLocalDate()

  const [inputWeight, setInputWeight] = useState('')
  const [inputDate,   setInputDate]   = useState(today)

  const { data: logs = [] } = useQuery({
    queryKey: ['weight-history', userId],
    queryFn: () => getWeightHistory(userId, 60),
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => logWeight(userId, parseFloat(inputWeight), inputDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-history', userId] })
      setInputWeight('')
      setInputDate(today)
    },
  })

  const todayLog   = logs.find(l => l.logged_date === today)
  const latest     = logs[logs.length - 1]
  const prev       = logs[logs.length - 2]
  const diff       = latest && prev ? +(latest.weight_kg - prev.weight_kg).toFixed(1) : null

  const yMin = logs.length ? Math.floor(Math.min(...logs.map(l => l.weight_kg)) - 2) : 50
  const yMax = logs.length ? Math.ceil(Math.max(...logs.map(l => l.weight_kg)) + 2) : 120

  const chartData = logs.map(l => ({
    date: formatDateShort(l.logged_date),
    poids: l.weight_kg,
    isToday: l.logged_date === today,
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Suivi du poids
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-4">

        {/* Quick entry */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Poids (kg)</label>
            <Input
              type="number"
              min={30} max={300} step={0.1}
              placeholder={todayLog ? todayLog.weight_kg.toString() : '0.0'}
              value={inputWeight}
              onChange={e => setInputWeight(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              className="h-9 w-36"
            />
          </div>
          <Button
            size="sm"
            className="h-9"
            disabled={!inputWeight || isNaN(parseFloat(inputWeight)) || isPending}
            onClick={() => save()}
          >
            {todayLog && inputDate === today ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>

        {/* Latest + trend */}
        {latest && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <span className="text-2xl font-bold tabular-nums">{latest.weight_kg}</span>
            <span className="text-sm text-muted-foreground">kg</span>
            {diff !== null && (
              <span className={`ml-auto flex items-center gap-1 text-sm font-medium ${
                diff < 0 ? 'text-green-600 dark:text-green-400' :
                diff > 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {diff < 0 ? <TrendingDown className="h-4 w-4" /> :
                 diff > 0 ? <TrendingUp   className="h-4 w-4" /> :
                            <Minus        className="h-4 w-4" />}
                {diff > 0 ? '+' : ''}{diff} kg
              </span>
            )}
          </div>
        )}

        {/* Chart */}
        {logs.length > 1 && (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[yMin, yMax]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  formatter={(v) => [`${v} kg`, 'Poids']}
                  labelStyle={{ fontSize: 11 }}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                {goalWeight && (
                  <ReferenceLine
                    y={goalWeight}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="4 3"
                    label={{ value: `Obj. ${goalWeight}kg`, position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--primary))' }}
                  />
                )}
                <Bar dataKey="poids" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isToday ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {logs.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            Aucune entrée — commencez par ajouter votre poids du jour.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
