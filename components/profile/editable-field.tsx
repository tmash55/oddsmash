"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Edit2, Check, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditableFieldProps {
  field: string
  label: string
  value: string
  icon: React.ReactNode
  type?: "input" | "select"
  options?: string[] | Record<string, string>
  placeholder?: string
  editingField: string | null
  setEditingField: (field: string | null) => void
  tempValues: Record<string, string>
  setTempValues: (values: Record<string, string>) => void
  onSave: (field: string, value: string) => Promise<void>
  saving: boolean
}

export function EditableField({
  field,
  label,
  value,
  icon,
  type = "input",
  options,
  placeholder,
  editingField,
  setEditingField,
  tempValues,
  setTempValues,
  onSave,
  saving,
}: EditableFieldProps) {
  const isEditing = editingField === field
  const displayValue: string =
    type === "select" && options && typeof options === "object" && !Array.isArray(options)
      ? (options[value as keyof typeof options] as string) || value
      : value

  return (
    <motion.div
      className={`group space-y-4 p-6 rounded-2xl border-2 transition-all duration-300 ${
        isEditing
          ? "border-blue-300 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-700 shadow-lg"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md cursor-pointer"
      }`}
      whileHover={{ scale: isEditing ? 1 : 1.01, y: isEditing ? 0 : -2 }}
      whileTap={{ scale: isEditing ? 1 : 0.99 }}
      onClick={() => {
        if (!isEditing) {
          setEditingField(field)
          setTempValues({ [field]: value })
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">{icon}</div>
          <Label className="text-base font-semibold text-gray-900 dark:text-white">{label}</Label>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingField(null)
                setTempValues({})
              }}
              disabled={saving}
              className="h-10 w-10 p-0 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <X className="w-4 h-4 text-red-600" />
            </Button>
            <Button
              size="sm"
              onClick={() => onSave(field, tempValues[field] || value)}
              disabled={saving || !tempValues[field] || tempValues[field] === value}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-10 px-4 shadow-lg"
            >
              {saving ? <Save className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-sm hidden sm:inline font-medium">Click to edit</span>
            <Edit2 className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      <div onClick={(e) => isEditing && e.stopPropagation()}>
        {isEditing ? (
          type === "select" ? (
            <Select
              value={tempValues[field] || value}
              onValueChange={(newValue) => setTempValues({ ...tempValues, [field]: newValue })}
            >
              <SelectTrigger className="h-12 border-2 bg-white dark:bg-gray-900">
                <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(options)
                  ? options.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))
                  : typeof options === "object" && options !== null
                  ? Object.entries(options).map(([key, displayName]) => (
                      <SelectItem key={key} value={key}>
                        {displayName} {key !== displayName && `(${key})`}
                      </SelectItem>
                    ))
                  : null}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={tempValues[field] || value}
              onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className="h-12 border-2 bg-white dark:bg-gray-900"
              autoFocus
            />
          )
        ) : (
          <div className="ml-14">
            <p className="text-gray-900 dark:text-white font-medium">
              {displayValue || (
                <span className="text-gray-500 dark:text-gray-400 italic">Add your {label.toLowerCase()}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
