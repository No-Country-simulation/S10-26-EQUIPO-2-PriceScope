export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Monitor de Inflación</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Resumen de variaciones y alertas (Semana 0)
          </p>
        </header>

        {/* Aquí irán los componentes que vayas creando: <Filtros />, <KpiGrid />, <Charts /> */}
      </div>
    </main>
  );
}