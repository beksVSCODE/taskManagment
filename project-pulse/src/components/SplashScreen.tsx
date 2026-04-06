import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Zap, Target, Rocket } from 'lucide-react';

export function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.2;
      });
    }, 25);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, []);

  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ clipPath: 'circle(0% at 50% 50%)' }}
          animate={{ clipPath: 'circle(150% at 50% 50%)' }}
          exit={{ clipPath: 'circle(0% at 50% 50%)' }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden"
        >
          {/* Animated geometric background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Rotating squares */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-primary/20 rounded-lg"
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-24 h-24 border-2 border-primary/15 rounded-lg"
              animate={{ rotate: -360, scale: [1, 0.8, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Floating dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary/30 rounded-full"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${30 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  x: [0, Math.sin(i) * 30, 0],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo with slide-in effect */}
            <motion.div
              initial={{ x: -300, rotate: -180 }}
              animate={{ x: 0, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 15,
                delay: 0.2,
              }}
              className="relative mb-8"
            >
              {/* Circular progress indicator */}
              <svg className="w-40 h-40 -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  stroke="hsl(var(--muted))"
                  strokeWidth="4"
                  fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="80"
                  cy="80"
                  r="60"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
                  }}
                />
              </svg>

              {/* Center icon with morph animation */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 hsl(var(--primary) / 0.7)',
                      '0 0 0 20px hsl(var(--primary) / 0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <CheckSquare className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Title with slide effect */}
            <motion.div
              initial={{ x: 300, scale: 0.5 }}
              animate={{ x: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 80,
                damping: 15,
                delay: 0.3,
              }}
              className="text-center mb-6"
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
                Project Pulse
              </h1>
              <p className="text-sm text-muted-foreground tracking-wider uppercase">
                Управление проектами
              </p>
            </motion.div>

            {/* Feature icons with stagger */}
            <motion.div
              initial={{ y: 50, scale: 0 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
              className="flex gap-6 mb-6"
            >
              {[
                { Icon: Zap, delay: 0.6, label: 'Быстро' },
                { Icon: Target, delay: 0.7, label: 'Точно' },
                { Icon: Rocket, delay: 0.8, label: 'Эффективно' },
              ].map(({ Icon, delay, label }) => (
                <motion.div
                  key={label}
                  initial={{ y: 20, scale: 0 }}
                  animate={{ y: 0, scale: 1 }}
                  transition={{ delay, type: 'spring', stiffness: 200 }}
                  className="flex flex-col items-center gap-1"
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay }}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                  </motion.div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Progress percentage */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: 'spring' }}
              className="text-center"
            >
              <motion.div
                className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tabular-nums"
                key={Math.round(progress)}
                initial={{ y: -10, scale: 1.2 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {Math.round(progress)}%
              </motion.div>
              <motion.div
                className="h-1 w-32 bg-muted rounded-full overflow-hidden mt-2"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/60"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
