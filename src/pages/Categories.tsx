
import { CategoryManager } from "@/components/categories/CategoryManager"

const Categories = () => {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your transactions into income, expenses, assets, liabilities, and transfers
          </p>
        </header>

        <CategoryManager />
      </div>
    </div>
  )
}

export default Categories