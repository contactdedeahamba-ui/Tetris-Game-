/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { COLS, ROWS, TETROMINOES } from './constants';

const createEmptyBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const getRandomPiece = () => {
  const keys = Object.keys(TETROMINOES);
  const type = keys[Math.floor(Math.random() * keys.length)];
  const { shape, color } = TETROMINOES[type];
  return {
    shape,
    color,
    type,
    pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
  };
};

export const useTetris = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [activePiece, setActivePiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(getRandomPiece());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  
  const gameLoopRef = useRef(null);
  const lastTimeRef = useRef(0);
  const dropCounterRef = useRef(0);

  const collide = (piece, boardData, offset = { x: 0, y: 0 }) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const newX = piece.pos.x + x + offset.x;
          const newY = piece.pos.y + y + offset.y;
          if (
            newX < 0 || newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && boardData[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const merge = (piece, currentBoard) => {
    const newBoard = currentBoard.map(row => [...row]);
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = piece.pos.y + y;
          const boardX = piece.pos.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      });
    });
    return newBoard;
  };

  const clearLines = (currentBoard) => {
    let linesCleared = 0;
    const newBoard = currentBoard.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0));
    }

    if (linesCleared > 0) {
      const linePoints = [0, 100, 300, 500, 800];
      setScore(prev => prev + linePoints[linesCleared] * level);
      setLines(prev => {
        const total = prev + linesCleared;
        setLevel(Math.floor(total / 10) + 1);
        return total;
      });
    }

    return newBoard;
  };

  const rotate = (matrix) => {
    const rotated = matrix[0].map((_, index) =>
      matrix.map(col => col[index]).reverse()
    );
    return rotated;
  };

  const drop = useCallback(() => {
    if (gameOver || paused || !activePiece) return;

    if (!collide(activePiece, board, { x: 0, y: 1 })) {
      setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } } : null);
    } else {
      // Landed
      const mergedBoard = merge(activePiece, board);
      const clearedBoard = clearLines(mergedBoard);
      setBoard(clearedBoard);

      const next = nextPiece;
      if (collide(next, clearedBoard)) {
        setGameOver(true);
      } else {
        setActivePiece(next);
        setNextPiece(getRandomPiece());
      }
    }
    dropCounterRef.current = 0;
  }, [activePiece, board, gameOver, nextPiece, paused, level]);

  const move = (dir) => {
    if (gameOver || paused || !activePiece) return;
    if (!collide(activePiece, board, { x: dir, y: 0 })) {
      setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } } : null);
    }
  };

  const manuallyRotate = () => {
    if (gameOver || paused || !activePiece) return;
    const rotatedShape = rotate(activePiece.shape);
    const originalPos = activePiece.pos.x;
    let offset = 1;
    const newPiece = { ...activePiece, shape: rotatedShape };
    
    // Wall kick simple implementation
    while (collide(newPiece, board)) {
      newPiece.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (Math.abs(newPiece.pos.x - originalPos) > activePiece.shape[0].length) {
        // Rotate failed
        return;
      }
    }
    setActivePiece(newPiece);
  };

  const hardDrop = () => {
    if (gameOver || paused || !activePiece) return;
    let y = 0;
    while (!collide(activePiece, board, { x: 0, y: y + 1 })) {
      y++;
    }
    const droppedPiece = { ...activePiece, pos: { ...activePiece.pos, y: activePiece.pos.y + y } };
    const mergedBoard = merge(droppedPiece, board);
    const clearedBoard = clearLines(mergedBoard);
    setBoard(clearedBoard);
    
    const next = nextPiece;
    if (collide(next, clearedBoard)) {
        setGameOver(true);
    } else {
        setActivePiece(next);
        setNextPiece(getRandomPiece());
    }
    setScore(prev => prev + (y * 2)); // Bonus for hard drop
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setGameOver(false);
    setScore(0);
    setLines(0);
    setLevel(1);
    setPaused(false);
    const first = getRandomPiece();
    setActivePiece(first);
    setNextPiece(getRandomPiece());
  };

  // Ghost piece calculation
  const getGhostPos = () => {
    if (!activePiece) return null;
    let y = 0;
    while (!collide(activePiece, board, { x: 0, y: y + 1 })) {
      y++;
    }
    return { x: activePiece.pos.x, y: activePiece.pos.y + y };
  };

  useEffect(() => {
    if (!activePiece && !gameOver) {
      setActivePiece(getRandomPiece());
    }
  }, [activePiece, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          move(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          move(1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          drop();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          manuallyRotate();
          break;
        case ' ':
          hardDrop();
          break;
        case 'p':
        case 'P':
          setPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePiece, board, gameOver, paused, drop]);

  const update = useCallback((time = 0) => {
    if (gameOver || paused) {
      gameLoopRef.current = requestAnimationFrame(update);
      return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    dropCounterRef.current += deltaTime;

    const dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    if (dropCounterRef.current > dropInterval) {
      drop();
    }

    gameLoopRef.current = requestAnimationFrame(update);
  }, [drop, gameOver, paused, level]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [update]);

  return {
    board,
    activePiece,
    nextPiece,
    ghostPos: getGhostPos(),
    score,
    gameOver,
    lines,
    level,
    paused,
    setPaused,
    resetGame,
  };
};
