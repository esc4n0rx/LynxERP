export const BlurBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(64, 64, 64, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(64, 64, 64, 0.2) 0%, transparent 50%)',
        }}
      />
    </div>
  );
};
