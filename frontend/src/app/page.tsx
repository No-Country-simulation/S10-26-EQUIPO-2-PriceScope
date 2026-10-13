import { Badge, Card } from "@tremor/react";

import { inflationSnapshot } from "@/lib/mockData";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Monitor de Inflación</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Resumen de variaciones y alertas (Semana 0)
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {inflationSnapshot.map((item) => (
            <Card key={item.category}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{item.category}</h2>
                <Badge color="blue">+{item.weeklyVariation}% semanal</Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Variación mensual acumulada: {item.monthlyVariation}%
              </p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
