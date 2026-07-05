const LoadingSpinner = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size]} border-2 border-surface-300 border-t-brand-500 rounded-full animate-spin`}
      />
      {text && <p className="text-surface-500 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-surface-200 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
};

export default LoadingSpinner;
