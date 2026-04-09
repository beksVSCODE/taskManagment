import { useHeaderCharacter } from '@/hooks/useHeaderCharacter';

/**
 * Анимация идущей кошки для Header.
 * - GIF выбирается пользователем в настройках
 * - Горизонтальное движение: CSS @keyframes (left: -80px → calc(100% + 10px))
 * - prefers-reduced-motion: кошка скрыта
 */
export function WalkingCat() {
  const { currentCharacter } = useHeaderCharacter();

  return (
    <>
      <style>{`
        @keyframes catWalk {
          from { left: -80px; }
          to   { left: calc(100% + 10px); }
        }
        .cat-walk-img {
          animation: catWalk 18s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cat-walk-container { display: none !important; }
        }
      `}</style>
      <div
        className="cat-walk-container"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <img
          src={currentCharacter.path}
          alt=""
          className="cat-walk-img"
          style={{
            position: 'absolute',
            bottom: `${currentCharacter.bottom}px`,
            height: `${currentCharacter.height}px`,
            width: 'auto',
          }}
        />
      </div>
    </>
  );
}

