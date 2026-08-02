import avatarAyomide from '@/assets/avatars/ayomide.jpg'
import avatarGavin from '@/assets/avatars/gavin.jpg'
import avatarReply from '@/assets/avatars/reply-1.jpg'
import attachmentImg from '@/assets/images/attachment.jpg'

export type TabId = 'threads' | 'unread' | 'resolved'

export const tabs = [
  { id: 'threads' as const, label: 'Threads', count: 126 },
  { id: 'unread' as const, label: 'Unread', count: 40 },
  { id: 'resolved' as const, label: 'Resolved', count: 5 },
]

export type Thread = {
  id: string
  name: string
  time: string
  body: string
  unread?: boolean
  resolved?: boolean
  avatar?: string
  initials?: string
  initialsColor?: string
  attachment?: string
  issue?: string
  replies?: { count: number; avatars: string[] }
}

export const threads: Thread[] = [
  {
    id: '0',
    name: 'Temitope Agboola',
    time: '12m',
    unread: true,
    initials: 'T',
    initialsColor: '#e11d48',
    body: 'Quick sync on the Posthearts v2 drawer — spacing and reply connectors look close. Can we review the shadow stack next?',
    issue: 'POS-240',
    replies: { count: 2, avatars: [avatarAyomide, avatarGavin] },
  },
  {
    id: '1',
    name: 'Gavin Nelson',
    time: '1h',
    unread: true,
    avatar: avatarGavin,
    body: 'this deserves some follow up now that OpenAI has made a bunch of updates and my opinions have changed.\n\n- New message input gives more space to add labels to the controls which is needed for the consumer market.',
    attachment: attachmentImg,
    replies: { count: 8, avatars: [avatarGavin, avatarAyomide] },
  },
  {
    id: '2',
    name: 'Ayomide Daniel',
    time: '3h',
    unread: true,
    avatar: avatarAyomide,
    body: 'Do you think this makes sense? I was just thinking about it and how it will potentially work. Happy to hear your thoughts. 👀',
    issue: 'POS-240',
    replies: { count: 1, avatars: [avatarReply] },
  },
  {
    id: '3',
    name: 'Ayomide Olaoluwa',
    time: '2d',
    initials: 'A',
    initialsColor: '#f34822',
    body: 'Not right now though\nJust setting up the App Architecture, Assets and ColorScheme',
    issue: 'POS-240',
  },
  {
    id: '4',
    name: 'Elijah Kingson',
    time: '4d',
    resolved: true,
    initials: 'E',
    initialsColor: '#6366f1',
    body: 'this deserves some follow up now that OpenAI has made a bunch of updates and my opinions have changed.\n\n- New message input gives more space to add labels to the controls which is needed for the consumer market.',
    replies: { count: 1, avatars: [avatarAyomide] },
  },
  {
    id: '5',
    name: 'Bode Slo',
    time: '10d',
    resolved: true,
    initials: 'B',
    initialsColor: '#0d9488',
    body: "i can't seem to download pdf",
    issue: 'POS-240',
  },
]
