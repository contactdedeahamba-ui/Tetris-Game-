/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { useTetris } from './useTetris';
import { COLS, ROWS, BLOCK_SIZE, COLORS } from './constants';

const StatBox = ({ label, value, colorClass = "" }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 mb-4">
    <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-bold">{label}</div>
    <div className={`text-3xl font-mono font-bold leading-none tabular-nums ${colorClass}`}>
      {value.toString().padStart(6, '0')}
    </div>
  </div>
);

export default function App() {
  const {
    board,
    activePiece,
    nextPiece,
    ghostPos,
    score,
    gameOver,
    lines,
    level,
    paused,
    setPaused,
    resetGame,
  } = useTetris();

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    // Draw ghost piece
    if (activePiece && ghostPos && !gameOver && !paused) {
      activePiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const boardY = ghostPos.y + y;
            const boardX = ghostPos.x + x;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
               displayBoard[boardY][boardX] = COLORS.ghost;
            }
          }
        });
      });
    }

    // Draw active piece
    if (activePiece && !gameOver && !paused) {
      activePiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const boardY = activePiece.pos.y + y;
            const boardX = activePiece.pos.x + x;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              displayBoard[boardY][boardX] = activePiece.color;
            }
          }
        });
      });
    }

    return displayBoard.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`${x}-${y}`}
          className={`relative ${cell !== 0 && cell !== COLORS.ghost ? 'active' : ''}`}
          style={{
            width: BLOCK_SIZE,
            height: BLOCK_SIZE,
            backgroundColor: cell === 0 ? 'transparent' : (cell === COLORS.ghost ? 'rgba(255,255,255,0.05)' : cell),
            border: cell === COLORS.ghost ? '1px dashed rgba(255,255,255,0.1)' : '1px solid rgba(51,65,85,0.3)',
            boxShadow: cell !== 0 && cell !== COLORS.ghost ? 'inset 0 0 10px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          {cell !== 0 && cell !== COLORS.ghost && (
            <div className="absolute inset-0 border-2 border-white/20" />
          )}
        </div>
      ))
    );
  };

  const renderNextPiece = () => {
    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-[2px] w-20 h-10">
        {nextPiece.shape.slice(0, 2).map((row, y) =>
          [0, 1, 2, 3].map(x => {
            const val = row[x] || 0;
            return (
              <div
                key={`next-${x}-${y}`}
                className="w-full h-full border border-slate-700/30"
                style={{
                  backgroundColor: val !== 0 ? nextPiece.color : 'transparent',
                }}
              />
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center font-sans overflow-hidden p-4 selection:bg-cyan-500/30">
      
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_rgba(30,41,59,1)_0%,_rgba(15,23,42,1)_100%)]" />

      <div className="relative flex flex-col md:flex-row gap-12 items-start z-10 transition-all duration-500">
        
        {/* Left Section: Scores & Stats */}
        <div className="w-full md:w-48 order-2 md:order-1">
          <StatBox label="Score" value={score} colorClass="text-cyan-400" />
          <StatBox label="Level" value={level} />
          <StatBox label="Lines" value={lines} />

          <div className="mt-8 opacity-40 group hover:opacity-100 transition-opacity">
            <h3 className="text-[10px] font-bold mb-4 text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">High Scores</h3>
            <ul className="text-xs font-mono space-y-2">
              <li className="flex justify-between"><span>01.</span> <span>012,400</span></li>
              <li className="flex justify-between"><span>02.</span> <span>009,250</span></li>
              <li className="flex justify-between"><span>03.</span> <span>008,100</span></li>
            </ul>
          </div>
        </div>

        {/* Center Section: Game Board */}
        <div className="order-1 md:order-2">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
          >
            <div 
              className="bg-[#0f172a]/80 border-[4px] border-[#334155] shadow-2xl overflow-hidden grid"
              style={{ 
                width: COLS * BLOCK_SIZE,
                height: ROWS * BLOCK_SIZE,
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`
              }}
            >
              {renderBoard()}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {(gameOver || paused) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70 backdrop-blur-[2px]"
                >
                  <div className="text-center space-y-6 p-8">
                    {gameOver ? (
                      <>
                        <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tighter">Mission Failed</h2>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Final Integrity</p>
                          <p className="text-2xl font-mono">{score.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={resetGame}
                          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-6 py-3 rounded font-bold uppercase text-xs transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                        >
                          Restart Engine
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <h2 className="text-2xl font-bold tracking-[0.2em] uppercase text-slate-300">Paused</h2>
                          <div className="w-12 h-0.5 bg-cyan-500 mx-auto" />
                        </div>
                        <button 
                          onClick={() => setPaused(false)}
                          className="bg-transparent border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-slate-900 px-8 py-3 rounded font-bold uppercase text-xs transition-all active:scale-95"
                        >
                          Resume
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Section: Next & Controls */}
        <div className="w-full md:w-64 order-3 flex flex-col gap-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6 flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-6 font-bold">Next Piece</div>
            <div className="p-4 bg-[#0f172a] rounded border border-slate-700/50 shadow-inner">
              {renderNextPiece()}
            </div>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
            <h3 className="text-xs font-bold mb-4 border-b border-slate-700 pb-2 uppercase tracking-widest text-slate-300">Controls</h3>
            <div className="space-y-4 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              <div className="flex justify-between items-center text-slate-300">
                <span>Move</span>
                <div className="flex gap-1">
                  <kbd className="bg-[#334155] px-2 py-1 rounded shadow-[0_2px_0_#0f1724] text-[10px] min-w-[24px] text-center">←</kbd>
                  <kbd className="bg-[#334155] px-2 py-1 rounded shadow-[0_2px_0_#0f1724] text-[10px] min-w-[24px] text-center">→</kbd>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Rotate</span>
                <kbd className="bg-[#334155] px-2 py-1 rounded shadow-[0_2px_0_#0f1724] text-[10px] min-w-[24px] text-center text-slate-300">↑</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Soft Drop</span>
                <kbd className="bg-[#334155] px-2 py-1 rounded shadow-[0_2px_0_#0f1724] text-[10px] min-w-[24px] text-center text-slate-300">↓</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Hard Drop</span>
                <kbd className="bg-[#334155] px-2 py-1 rounded shadow-[0_2px_0_#0f1724] text-[10px] px-3 min-w-[60px] text-center text-slate-300">Space</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Pause</span>
                <kbd className="bg-[#334155] px-2 py-1 rounded shadow-[0_2px_0_#0f1724] text-[10px] min-w-[24px] text-center text-slate-300">P</kbd>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setPaused(!paused)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-[10px] uppercase font-bold transition-all"
            >
              System {paused ? 'Resume' : 'Pause'}
            </button>
            <button 
              onClick={resetGame}
              className="px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-2 rounded text-[10px] uppercase font-bold transition-all"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 text-[9px] text-slate-500 tracking-[0.2em] font-mono leading-relaxed text-center uppercase">
            Designed for GitHub Pages<br/>
            v1.0.4 - Engine Stable
          </div>
        </div>

      </div>
    </div>
  );
}
