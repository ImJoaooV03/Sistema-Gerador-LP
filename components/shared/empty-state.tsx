type EmptyStateProps = {
  icon: string
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <span className="text-4xl opacity-20">{icon}</span>
      <span className="font-syne text-[17px] font-bold text-text-2">{title}</span>
      <span className="text-[12px] text-text-3 font-mono">{description}</span>
    </div>
  )
}
