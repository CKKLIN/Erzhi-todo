export interface Todo {
  id: number
  text: string
  done: boolean
  color: string
  createdAt: string
}

export interface Memo {
  id: number
  text: string
  color: string
  createdAt: string
  reminderTime?: string
}

export interface ThemePreset {
  name: string
  bg: string
  text: string
  muted: string
  border: string
  inputBg: string
  hover: string
}
