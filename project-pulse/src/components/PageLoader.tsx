import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageLoaderProps {
  loading: boolean;
}

export function PageLoader({ loading }: PageLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      setShowSpinner(false);

      const progressTimer = setTimeout(() => {
        setProgress(85);
      }, 100);

      const spinnerTimer = setTimeout(() => {
        setShowSpinner(true);
      }, 600);

      return () => {
        clearTimeout(progressTimer);
        clearTimeout(spinnerTimer);
      };
    } else {
      setProgress(100);
      setShowSpinner(false);

      const hideTimer = setTimeout(() => {
        setProgress(0);
      }, 300);

      return () => clearTimeout(hideTimer);
    }
  }, [loading]);

  if (progress === 0) return null;

  return (
    <>
      {/* Прогресс-бар с волновым эффектом */}
      <div className="fixed top-0 left-0 right-0 z-[9998] h-1 bg-gradient-to-r from-transparent via-muted/30 to-transparent overflow-hidden">
        <motion.div
          className="h-full relative"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: progress === 100 ? 0.3 : 0.6, // Увеличено
            ease: [0.22, 1, 0.36, 1], // Более плавный easing
          }}
        >
          {/* Градиентная полоска */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
          
          {/* Волновой блик */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2, // Увеличено с 1.5
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          
          {/* Светящийся край */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-primary/0 via-primary to-primary blur-sm" />
        </motion.div>
      </div>

      {/* Спиннер с красивой анимацией */}
      <AnimatePresence>
        {showSpinner && loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9997] flex flex-col items-center justify-center bg-background/70 backdrop-blur-md"
          >
            {/* Внешнее кольцо */}
            <div className="relative">
              <motion.div
                className="w-20 h-20 rounded-full border-4 border-muted/30"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4, // Увеличено с 3
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              {/* Градиентное кольцо */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2, // Увеличено с 1.5
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              {/* Центральная точка */}
              <motion.div
                className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2.5, // Увеличено с 2
                  repeat: Infinity,
                  ease: [0.45, 0, 0.55, 1],
                }}
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
              </motion.div>
            </div>

            {/* Текст с анимацией */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 flex items-center gap-2"
            >
              <motion.p
                className="text-sm font-medium text-muted-foreground"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2.5, // Увеличено с 2
                  repeat: Infinity,
                  ease: [0.45, 0, 0.55, 1],
                }}
              >
                Загрузка
              </motion.p>
              <motion.div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-muted-foreground"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.2, // Увеличено с 1
                      repeat: Infinity,
                      delay: i * 0.25, // Увеличено с 0.2
                      ease: [0.45, 0, 0.55, 1],
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
