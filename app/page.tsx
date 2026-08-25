export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-4xl font-bold text-slate-900">
        Inkling 
      </h1>
      <p className="mt-2 text-slate-600">
          Your AI powered workspace
      </p>

      <div className="mt-8">
        <button className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700">
          + Create Workspace
        </button>
      </div>
    </main>
  );
}