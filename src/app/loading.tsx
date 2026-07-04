import {asset} from '../config';

const Loading = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 24,
        backgroundColor: 'var(--host-surface, #e8f4fb)',
      }}
    >
      <img
        className='ks-runner'
        src={asset('/assets/kindsight/mascot-run.png')}
        alt=''
        aria-hidden='true'
        style={{width: 'min(220px, 44vw)', height: 'auto'}}
      />
      <p
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
          fontWeight: 700,
          fontSize: 22,
          color: 'var(--main-color, #1e2538)',
        }}
      >
        Loading...
      </p>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-color, #666e84)',
          fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
        }}
      >
        Please wait a moment
      </p>
      <style>{`
        .ks-runner { animation: ks-run-bob 0.8s ease-in-out infinite; }
        @keyframes ks-run-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ks-runner { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Loading;
