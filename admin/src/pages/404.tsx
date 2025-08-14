export default function PageNotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='text-center'>
        <h1 className='text-4xl font-bold mb-2'>404</h1>
        <p className='text-muted-foreground mb-4'>Page not found</p>
        <button
          onClick={() => window.history.back()}
          className='text-primary hover:underline'
        >
          Go back
        </button>
      </div>
    </div>
  );
}
