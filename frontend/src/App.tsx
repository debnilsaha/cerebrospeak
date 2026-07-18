function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="p-10 text-center"
        style={{
          background: 'var(--clay-surface)',
          borderRadius: 'var(--clay-radius)',
          boxShadow: 'var(--clay-shadow)',
        }}
      >
        <h1 className="text-3xl font-extrabold text-indigo-600">CerebroSpeak</h1>
        <p className="mt-3 text-lg text-gray-500">Claymorphism design system loaded ✓</p>
      </div>
    </div>
  )
}

export default App