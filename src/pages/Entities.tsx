import { EntityManager } from "@/components/entities/EntityManager"

const Entities = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold" data-testid="entities-page-title">Entities</h1>
          <p className="text-muted-foreground" data-testid="entities-page-subtitle">Manage family members and business entities</p>
        </header>

        <EntityManager />
      </div>
    </div>
  )
}

export default Entities