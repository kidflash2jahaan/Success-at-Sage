'use client'
import { useState } from 'react'
import SubmissionReviewer from './SubmissionReviewer'

interface SubmissionItem {
  id: string
  title: string
  type: string
  contentType: 'richtext' | 'pdf'
  contentJson: unknown
  pdfPath: string | null
  linkUrl: string | null
  attachmentPaths: string[]
  uploaderName: string
  uploaderEmail: string
  unitTitle: string
  courseName: string
}

interface AvailableUnit {
  id: string
  title: string
  courseName: string
}

interface Course {
  id: string
  name: string
}

export default function MaterialsReviewList({ items, availableUnits = [], courses = [] }: { items: SubmissionItem[], availableUnits?: AvailableUnit[], courses?: Course[] }) {
  const [ignoredUsers, setIgnoredUsers] = useState<Set<string>>(new Set())

  function ignoreUser(email: string) {
    setIgnoredUsers(prev => new Set(prev).add(email))
  }

  function unignoreUser(email: string) {
    setIgnoredUsers(prev => {
      const next = new Set(prev)
      next.delete(email)
      return next
    })
  }

  const visible = items.filter(i => !ignoredUsers.has(i.uploaderEmail))

  return (
    <div>
      {ignoredUsers.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[...ignoredUsers].map(email => (
            <button
              key={email}
              type="button"
              onClick={() => unignoreUser(email)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full glass text-white/40 hover:text-white/70 transition-colors"
            >
              <span>{email}</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          <span className="text-xs text-white/25 self-center">{items.length - visible.length} hidden — click to restore</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {visible.map(item => (
          <SubmissionReviewer
            key={item.id}
            item={item}
            availableUnits={availableUnits}
            courses={courses}
            onIgnoreUser={() => ignoreUser(item.uploaderEmail)}
          />
        ))}
      </div>
    </div>
  )
}
