import { Award } from 'lucide-react';

export default function AchievementsPanel({ achievements = [] }) {
  if (!achievements.length) return null;

  return (
    <div className="w-full max-w-xl mt-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-amber-400" />
        <div className="font-orbitron text-[10px] tracking-[0.3em] text-white/50">ACHIEVEMENTS</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="rounded-xl px-3 py-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)' }}>
            <div className="font-orbitron text-[10px] text-amber-300">{achievement.name}</div>
            <div className="text-[10px] text-white/45 mt-1">{achievement.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}