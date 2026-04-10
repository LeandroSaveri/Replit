import { motion } from 'framer-motion';
import { Box } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Carregando projeto...' }: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 bg-slate-950 z-[200] flex flex-col items-center justify-center"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-3xl animate-orb-float" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-8"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 blur-xl opacity-60 animate-pulse-slow" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Box className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            AuriPlan
          </span>
          <span className="text-sm text-slate-500">{message}</span>
        </div>

        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.3 }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
