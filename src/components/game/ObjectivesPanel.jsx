import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Target } from 'lucide-react';

export default function ObjectivesPanel({ objectives }) {
  if (!objectives?.length) return null;
  const completed = objectives.filter(o => o.done).length;
  const total = objectives.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-16 right-3 z-10 max-w-[200px] pointer-events-none"
    >
      <div
        className="rounded-2xl p-3 backdrop-blur-md"
        style={{ background: 'rgba(5,5,18,0.75)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="w-3 h-3" style={{ color: 'rgba(160,130,255,0.8)' }} />
          <span className="font-orbitron text-[11px] tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            MISSION
          </span>
          <span className="font-orbitron text-[12px] ml-auto" style={{ color: completed === total ? '#34d399' : 'rgba(160,130,255,0.8)' }}>
            {completed}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 rounded-full mb-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${(completed / total) * 100}%` }}
            transition={{ duration: 0.4, type: 'spring' }}
            style={{ background: completed === total ? '#34d399' : '#a855f7' }}
          />
        </div>

        {/* Objective list */}
        <div className="space-y-1.5">
          {objectives.map((obj) => (
            <motion.div
              key={obj.id}
              animate={{ opacity: obj.done ? 0.4 : 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-1.5"
            >
              <AnimatePresence mode="wait">
                {obj.done ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-0.5 flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" style={{ color: '#34d399' }} />
                  </motion.div>
                ) : (
                  <motion.div key="circle" className="mt-0.5 flex-shrink-0">
                    <Circle className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="text-[12px] leading-tight" style={{
                color: obj.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.65)',
                textDecoration: obj.done ? 'line-through' : 'none',
                fontFamily: "'Exo 2', sans-serif",
              }}>
                {obj.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}