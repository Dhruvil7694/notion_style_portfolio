import type { ContextBudget } from "../settings"

export type BudgetCategory =
  | "project"
  | "research"
  | "article"
  | "automation"
  | "concept"
  | "technology"
  | "expertise"

export type BudgetAllocation = Record<BudgetCategory, number>

export const DEFAULT_TOTAL_BUDGET = 12_000

export function budgetToAllocation(budget: ContextBudget): BudgetAllocation {
  return {
    project: budget.projects,
    research: budget.research,
    article: budget.research,
    automation: Math.round(budget.research / 2),
    concept: budget.concepts,
    technology: budget.technologies,
    expertise: budget.expertise,
  }
}

export function charsForCategory(
  totalBudget: number,
  allocation: BudgetAllocation,
  category: BudgetCategory
): number {
  const totalWeight = Object.values(allocation).reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) return 0
  return Math.floor((allocation[category] / totalWeight) * totalBudget)
}

export function buildCategoryBudgets(
  budget: ContextBudget,
  totalBudget = DEFAULT_TOTAL_BUDGET
): Record<BudgetCategory, number> {
  const allocation = budgetToAllocation(budget)
  return {
    project: charsForCategory(totalBudget, allocation, "project"),
    research: charsForCategory(totalBudget, allocation, "research"),
    article: charsForCategory(totalBudget, allocation, "article"),
    automation: charsForCategory(totalBudget, allocation, "automation"),
    concept: charsForCategory(totalBudget, allocation, "concept"),
    technology: charsForCategory(totalBudget, allocation, "technology"),
    expertise: charsForCategory(totalBudget, allocation, "expertise"),
  }
}
