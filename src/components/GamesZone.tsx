import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Gamepad2,
  RotateCcw,
  Trophy,
  Users,
  Bot,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Film,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { playGameSound } from '../utils/notificationSound';

type GameTab = 'xo' | 'snake' | 'quiz';

// ==================== 1. TIC-TAC-TOE (X-O) ====================
const XO_SCORES_KEY = 'awn_tv_xo_scores_v1';
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function checkWinner(board: (string | null)[]): { winner: string | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
}

function getSmartAIMove(board: (string | null)[]): number {
  const empty = board
    .map((v, i) => (v === null ? i : -1))
    .filter((i) => i !== -1);
  if (empty.length === 0) return -1;

  // 1. Win if possible
  for (const idx of empty) {
    const copy = [...board];
    copy[idx] = 'O';
    if (checkWinner(copy).winner === 'O') return idx;
  }
  // 2. Block player X
  for (const idx of empty) {
    const copy = [...board];
    copy[idx] = 'X';
    if (checkWinner(copy).winner === 'X') return idx;
  }
  // 3. Center
  if (board[4] === null) return 4;
  // 4. Corners
  const corners = [0, 2, 6, 8].filter((c) => board[c] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

const TicTacToeGame: React.FC = () => {
  const [mode, setMode] = useState<'ai' | 'pvp'>('ai');
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [aiThinking, setAiThinking] = useState(false);
  const [scores, setScores] = useState<{ x: number; o: number; draw: number }>(() => {
    try {
      const saved = localStorage.getItem(XO_SCORES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: 0, o: 0, draw: 0 };
  });

  const { winner, line: winLine } = checkWinner(board);
  const isDraw = !winner && board.every((cell) => cell !== null);
  const gameOver = Boolean(winner || isDraw);

  const saveScore = useCallback((next: { x: number; o: number; draw: number }) => {
    setScores(next);
    try {
      localStorage.setItem(XO_SCORES_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const resetBoard = (nextMode?: 'ai' | 'pvp') => {
    if (nextMode) setMode(nextMode);
    setBoard(Array(9).fill(null));
    setTurn('X');
    setAiThinking(false);
    playGameSound('click');
  };

  const applyMove = useCallback(
    (index: number, player: 'X' | 'O', currentBoard: (string | null)[]) => {
      const nextBoard = [...currentBoard];
      nextBoard[index] = player;
      setBoard(nextBoard);
      playGameSound('move');

      const res = checkWinner(nextBoard);
      if (res.winner) {
        playGameSound(res.winner === 'X' ? 'win' : 'lose');
        saveScore({
          ...scores,
          x: res.winner === 'X' ? scores.x + 1 : scores.x,
          o: res.winner === 'O' ? scores.o + 1 : scores.o
        });
        return;
      }
      if (nextBoard.every((c) => c !== null)) {
        saveScore({ ...scores, draw: scores.draw + 1 });
        return;
      }
      setTurn(player === 'X' ? 'O' : 'X');
    },
    [scores, saveScore]
  );

  // Trigger AI move when it's O's turn in AI mode
  useEffect(() => {
    if (mode !== 'ai' || turn !== 'O' || gameOver) return;
    setAiThinking(true);
    const timer = setTimeout(() => {
      const aiIdx = getSmartAIMove(board);
      if (aiIdx !== -1) {
        applyMove(aiIdx, 'O', board);
      }
      setAiThinking(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [mode, turn, gameOver, board, applyMove]);

  const handleCellClick = (idx: number) => {
    if (board[idx] !== null || gameOver || aiThinking) return;
    if (mode === 'ai' && turn === 'O') return;
    applyMove(idx, turn, board);
  };

  return (
    <div className="max-w-xl mx-auto bg-[#141414] border border-[#292929] rounded-3xl p-5 sm:p-7 shadow-2xl">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0d0d0d] border border-[#252525]">
          <button
            onClick={() => resetBoard('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'ai' ? 'bg-[#e50914] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>ضد الذكاء الاصطناعي</span>
          </button>
          <button
            onClick={() => resetBoard('pvp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'pvp' ? 'bg-[#e50914] text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>لاعبين (صديق)</span>
          </button>
        </div>

        <button
          onClick={() => resetBoard()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>جولة جديدة</span>
        </button>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
        <div className="p-2.5 rounded-2xl bg-[#1c1012] border border-[#e50914]/35">
          <p className="text-[11px] text-zinc-400">اللاعب X</p>
          <p className="text-xl font-black text-[#ff4d4d] tabular-nums">{scores.x}</p>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#1a1a1a] border border-[#2c2c2c]">
          <p className="text-[11px] text-zinc-400">التعادل</p>
          <p className="text-xl font-black text-zinc-200 tabular-nums">{scores.draw}</p>
        </div>
        <div className="p-2.5 rounded-2xl bg-[#11191d] border border-amber-400/30">
          <p className="text-[11px] text-zinc-400">{mode === 'ai' ? 'الذكاء O' : 'اللاعب O'}</p>
          <p className="text-xl font-black text-amber-400 tabular-nums">{scores.o}</p>
        </div>
      </div>

      {/* Turn / Result Banner */}
      <div className="text-center mb-4">
        {winner ? (
          <p className="text-sm sm:text-base font-black text-emerald-400">
            🎉 الفائز هو: {winner === 'X' ? 'اللاعب X' : mode === 'ai' ? 'الذكاء الاصطناعي (O)' : 'اللاعب O'}!
          </p>
        ) : isDraw ? (
          <p className="text-sm sm:text-base font-black text-amber-300">🤝 تعادل! جولة قوية</p>
        ) : (
          <p className="text-xs sm:text-sm font-bold text-zinc-300">
            {aiThinking
              ? 'الذكاء الاصطناعي يفكر...'
              : `الدور الحالي: ${turn === 'X' ? 'اللاعب X' : mode === 'ai' ? 'الكمبيوتر O' : 'اللاعب O'}`}
          </p>
        )}
      </div>

      {/* 3x3 Board */}
      <div className="grid grid-cols-3 gap-3 max-w-[300px] sm:max-w-[330px] mx-auto">
        {board.map((cell, idx) => {
          const isWinCell = winLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`aspect-square rounded-2xl text-3xl sm:text-4xl font-black flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
                isWinCell
                  ? 'bg-[#e50914]/25 border-[#e50914] shadow-[0_0_25px_rgba(229,9,20,0.45)] scale-[1.03]'
                  : 'bg-[#1c1c1c] hover:bg-[#242424] border-[#303030]'
              }`}
            >
              <span className={cell === 'X' ? 'text-[#ff333d]' : 'text-amber-400'}>
                {cell}
              </span>
            </button>
          );
        })}
      </div>

      {gameOver && (
        <div className="mt-5 text-center">
          <button
            onClick={() => resetBoard()}
            className="px-6 py-2.5 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-black shadow-lg cursor-pointer"
          >
            العب مرة أخرى
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== 2. NEON RED SNAKE GAME ====================
const SNAKE_HIGHSCORE_KEY = 'awn_tv_snake_highscore_v1';
const GRID_SIZE = 16;

type Point = { x: number; y: number };

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 }
  ]);
  const [food, setFood] = useState<Point>({ x: 12, y: 8 });
  const [dir, setDir] = useState<Point>({ x: 1, y: 0 });
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SNAKE_HIGHSCORE_KEY);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const spawnFood = useCallback((occupied: Point[]): Point => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const p = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!occupied.some((seg) => seg.x === p.x && seg.y === p.y)) {
        return p;
      }
    }
    return { x: 0, y: 0 };
  }, []);

  const startNewGame = useCallback(() => {
    const initialSnake = [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
      { x: 6, y: 8 }
    ];
    setSnake(initialSnake);
    setFood(spawnFood(initialSnake));
    const initialDir = { x: 1, y: 0 };
    setDir(initialDir);
    dirRef.current = initialDir;
    setScore(0);
    setIsGameOver(false);
    setIsRunning(true);
    playGameSound('click');
  }, [spawnFood]);

  const changeDirection = useCallback((next: Point) => {
    const cur = dirRef.current;
    // Prevent 180-degree self reversal
    if (cur.x + next.x === 0 && cur.y + next.y === 0) return;
    dirRef.current = next;
    setDir(next);
    if (!isRunning && !isGameOver) {
      setIsRunning(true);
    }
  }, [isRunning, isGameOver]);

  // Keyboard Arrow / WASD controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          changeDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          changeDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          changeDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          changeDirection({ x: 1, y: 0 });
          break;
        case ' ':
          if (!isGameOver) setIsRunning((r) => !r);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changeDirection, isGameOver]);

  // Game tick loop
  useEffect(() => {
    if (!isRunning || isGameOver) return;
    const speedMs = Math.max(85, 165 - Math.floor(score / 30) * 10);

    const interval = setInterval(() => {
      setSnake((prev) => {
        const activeDir = dirRef.current;
        const head = prev[0];
        const nextHead = { x: head.x + activeDir.x, y: head.y + activeDir.y };

        // Wall collision
        if (
          nextHead.x < 0 ||
          nextHead.x >= GRID_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= GRID_SIZE
        ) {
          setIsGameOver(true);
          setIsRunning(false);
          playGameSound('lose');
          return prev;
        }

        const ateFood = nextHead.x === food.x && nextHead.y === food.y;
        const bodyToCheck = ateFood ? prev : prev.slice(0, -1);

        if (bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y)) {
          setIsGameOver(true);
          setIsRunning(false);
          playGameSound('lose');
          return prev;
        }

        const nextSnake = ateFood ? [nextHead, ...prev] : [nextHead, ...prev.slice(0, -1)];
        if (ateFood) {
          playGameSound('eat');
          setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              try {
                localStorage.setItem(SNAKE_HIGHSCORE_KEY, String(newScore));
              } catch {}
            }
            return newScore;
          });
          setFood(spawnFood(nextSnake));
        }
        return nextSnake;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [isRunning, isGameOver, food, score, highScore, spawnFood]);

  return (
    <div className="max-w-xl mx-auto bg-[#141414] border border-[#292929] rounded-3xl p-4 sm:p-6 shadow-2xl">
      {/* Top Score Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0d0d0d] border border-[#e50914]/40">
            <span className="text-[11px] text-zinc-400">النقاط: </span>
            <span className="text-sm font-black text-[#ff4d4d] tabular-nums">{score}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0d0d0d] border border-amber-400/30">
            <span className="text-[11px] text-zinc-400">أعلى نتيجة: </span>
            <span className="text-sm font-black text-amber-400 tabular-nums">{highScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isGameOver && (
            <button
              onClick={() => setIsRunning((r) => !r)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white cursor-pointer"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? 'إيقاف' : 'تشغيل'}</span>
            </button>
          )}
          <button
            onClick={startNewGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-xs font-bold text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة</span>
          </button>
        </div>
      </div>

      {/* Neon Grid Arena */}
      <div
        dir="ltr"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          if (!touchStartRef.current) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - touchStartRef.current.x;
          const dy = t.clientY - touchStartRef.current.y;
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
            changeDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
          } else if (Math.abs(dy) > 20) {
            changeDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
          }
          touchStartRef.current = null;
        }}
        className="relative aspect-square w-full max-w-[340px] mx-auto rounded-2xl bg-[#090909] border-2 border-[#e50914]/50 shadow-[0_0_35px_rgba(229,9,20,0.2)] overflow-hidden grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
          const x = idx % GRID_SIZE;
          const y = Math.floor(idx / GRID_SIZE);
          const snakeIdx = snake.findIndex((s) => s.x === x && s.y === y);
          const isHead = snakeIdx === 0;
          const isBody = snakeIdx > 0;
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={idx}
              className="border-[0.5px] border-white/[0.025] flex items-center justify-center p-[1px]"
            >
              {isHead ? (
                <div className="w-full h-full rounded-[4px] bg-[#ff2a2a] shadow-[0_0_12px_#ff2a2a]" />
              ) : isBody ? (
                <div className="w-full h-full rounded-[3px] bg-[#b80710]/90" />
              ) : isFood ? (
                <div className="w-[80%] h-[80%] rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
              ) : null}
            </div>
          );
        })}

        {/* Start / Game Over Overlay */}
        {(!isRunning || isGameOver) && (
          <div
            dir="rtl"
            className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center"
          >
            {isGameOver ? (
              <>
                <p className="text-lg font-black text-[#ff4d4d] mb-1">انتهت اللعبة!</p>
                <p className="text-xs text-zinc-300 mb-4">
                  نقاطك: <strong className="text-white">{score}</strong> · أعلى نتيجة: <strong className="text-amber-400">{highScore}</strong>
                </p>
                <button
                  onClick={startNewGame}
                  className="px-6 py-2.5 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-black shadow-lg cursor-pointer"
                >
                  العب مرة أخرى
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-black text-white mb-2">ثعبان النيون الأحمر 🐍</p>
                <p className="text-[11px] text-zinc-400 mb-4">
                  تحكم بالأسهم على الكيبورد أو اللمس والأزرار بالأسفل
                </p>
                <button
                  onClick={startNewGame}
                  className="px-6 py-2.5 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-black shadow-lg cursor-pointer"
                >
                  ابدأ اللعب الآن
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Touch Controls D-Pad (For Mobile & Mouse Play) */}
      <div dir="ltr" className="mt-4 flex flex-col items-center gap-1.5">
        <button
          onClick={() => changeDirection({ x: 0, y: -1 })}
          className="w-12 h-11 rounded-xl bg-[#1e1e1e] hover:bg-[#e50914] text-white flex items-center justify-center border border-[#333333] active:scale-95 cursor-pointer"
          aria-label="أعلى"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDirection({ x: -1, y: 0 })}
            className="w-12 h-11 rounded-xl bg-[#1e1e1e] hover:bg-[#e50914] text-white flex items-center justify-center border border-[#333333] active:scale-95 cursor-pointer"
            aria-label="يسار"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeDirection({ x: 0, y: 1 })}
            className="w-12 h-11 rounded-xl bg-[#1e1e1e] hover:bg-[#e50914] text-white flex items-center justify-center border border-[#333333] active:scale-95 cursor-pointer"
            aria-label="أسفل"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => changeDirection({ x: 1, y: 0 })}
            className="w-12 h-11 rounded-xl bg-[#1e1e1e] hover:bg-[#e50914] text-white flex items-center justify-center border border-[#333333] active:scale-95 cursor-pointer"
            aria-label="يمين"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 3. GUESS THE MOVIE / PLAYER QUIZ ====================
interface QuizQuestion {
  id: number;
  category: 'movies' | 'football';
  emojis: string;
  hint: string;
  options: string[];
  answerIndex: number;
}

const QUIZ_BANK: QuizQuestion[] = [
  {
    id: 1,
    category: 'movies',
    emojis: '🚢 ❄️ 💑 🌊',
    hint: 'فيلم رومانسي شهير تدور أحداثه على متن سفينة ضخمة عام 1912',
    options: ['تايتانيك (Titanic)', 'القراصنة (Pirates)', 'أفاتار (Avatar)', 'بداية جديدة (Inception)'],
    answerIndex: 0
  },
  {
    id: 2,
    category: 'football',
    emojis: '🇦🇷 🐐 🏆 🔟',
    hint: 'قائد المنتخب الأرجنتيني المتوج بكأس العالم 2022 وأسطورة برشلونة',
    options: ['كريستيانو رونالدو', 'ليونيل ميسي', 'نيمار جونيور', 'دييغو مارادونا'],
    answerIndex: 1
  },
  {
    id: 3,
    category: 'movies',
    emojis: '🦁 👑 🌅 🐒',
    hint: 'فيلم ديزني الكلاسيكي الشهير عن سيمبا ومملكة الحيوانات',
    options: ['طرزان', 'الأسد الملك (The Lion King)', 'كتاب الأدغال', 'فروزن'],
    answerIndex: 1
  },
  {
    id: 4,
    category: 'football',
    emojis: '🇵🇹 ⚽ 🚀 7️⃣',
    hint: 'الهداف التاريخي لدوري أبطال أوروبا ونجم النصر السعودي',
    options: ['كيليان مبابي', 'كريم بنزيما', 'كريستيانو رونالدو', 'روبرت ليفاندوفسكي'],
    answerIndex: 2
  },
  {
    id: 5,
    category: 'movies',
    emojis: '🕷️ 🧑 🕸️ 🏙️',
    hint: 'بطل خارق شاب يكتسب قدرات عنكبوتية ويحمي مدينة نيويورك',
    options: ['باتمان', 'آيرون مان', 'سبايدرمان (Spider-Man)', 'سوبرمان'],
    answerIndex: 2
  },
  {
    id: 6,
    category: 'football',
    emojis: '🇪🇬 🔴 👑 ⚽',
    hint: 'نجم ليفربول والمنتخب المصري الملقب بالملك المصري',
    options: ['رياض محرز', 'محمد صلاح', 'أشرف حكيمي', 'سالم الدوسري'],
    answerIndex: 1
  },
  {
    id: 7,
    category: 'movies',
    emojis: '🧙‍♂️ ⚡ 🦉 🏰',
    hint: 'ساحر شاب يدرس في مدرسة هوغوورتس السحرية الشهيرة',
    options: ['سيد الخواتم', 'هاري بوتر (Harry Potter)', 'نارنيا', 'دكتور سترينج'],
    answerIndex: 1
  },
  {
    id: 8,
    category: 'football',
    emojis: '🇫🇷 ⚡ 🐢 🏆',
    hint: 'نجم فرنسي سريع جداً فاز بكأس العالم 2018 وانتقل إلى ريال مدريد',
    options: ['كيليان مبابي', 'أنطوان غريزمان', 'عثمان ديمبيلي', 'بيلينغهام'],
    answerIndex: 0
  },
  {
    id: 9,
    category: 'movies',
    emojis: '🏜️ 📱 🤣 🇸🇦',
    hint: 'مسلسل كوميدي سعودي شهير عن الشباب ومواقفهم المضحكة في الأحياء',
    options: ['طاش ما طاش', 'شباب البومب', 'سيلفي', 'العاصوف'],
    answerIndex: 1
  },
  {
    id: 10,
    category: 'football',
    emojis: '🇳🇴 🤖 ⚽ 🔵',
    hint: 'مهاجم نرويجي هداف مانشستر سيتي معروف بقوته البدنية وسرعة التسجيل',
    options: ['كيفين دي بروين', 'هاري كين', 'إيرلينغ هالاند', 'فيل فودين'],
    answerIndex: 2
  }
];

const QUIZ_HIGHSCORE_KEY = 'awn_tv_quiz_highscore_v1';

const GuessChallengeGame: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'movies' | 'football'>('all');
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(QUIZ_HIGHSCORE_KEY);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const questions = React.useMemo(
    () => (filter === 'all' ? QUIZ_BANK : QUIZ_BANK.filter((q) => q.category === filter)),
    [filter]
  );

  const currentQ = questions[qIndex] || questions[0];

  const restartQuiz = (newFilter?: 'all' | 'movies' | 'football') => {
    if (newFilter) setFilter(newFilter);
    setQIndex(0);
    setScore(0);
    setSelectedOption(null);
    setFinished(false);
    playGameSound('click');
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null || !currentQ) return;
    setSelectedOption(idx);

    const isCorrect = idx === currentQ.answerIndex;
    if (isCorrect) {
      playGameSound('win');
      setScore((prev) => {
        const next = prev + 10;
        if (next > highScore) {
          setHighScore(next);
          try {
            localStorage.setItem(QUIZ_HIGHSCORE_KEY, String(next));
          } catch {}
        }
        return next;
      });
    } else {
      playGameSound('lose');
    }

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        setFinished(true);
      } else {
        setQIndex((prev) => prev + 1);
        setSelectedOption(null);
      }
    }, 1150);
  };

  return (
    <div className="max-w-xl mx-auto bg-[#141414] border border-[#292929] rounded-3xl p-5 sm:p-7 shadow-2xl">
      {/* Category & Score Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0d0d0d] border border-[#252525]">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'movies', label: 'أفلام' },
            { id: 'football', label: 'لاعبون' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => restartQuiz(tab.id as 'all' | 'movies' | 'football')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === tab.id ? 'bg-[#e50914] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1 rounded-xl bg-[#0d0d0d] border border-[#e50914]/40 text-[#ff4d4d] tabular-nums">
            النقاط: {score}
          </span>
          <span className="px-3 py-1 rounded-xl bg-[#0d0d0d] border border-amber-400/30 text-amber-400 tabular-nums">
            الأعلى: {highScore}
          </span>
        </div>
      </div>

      {finished ? (
        <div className="text-center py-8">
          <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-3" />
          <h3 className="text-xl font-black text-white mb-1">أحسنت! أنهيت التحدي</h3>
          <p className="text-sm text-zinc-300 mb-5">
            نتيجتك النهائية: <strong className="text-[#ff4d4d]">{score}</strong> من <strong className="text-white">{questions.length * 10}</strong> نقطة
          </p>
          <button
            onClick={() => restartQuiz()}
            className="px-6 py-2.5 rounded-xl bg-[#e50914] hover:bg-[#ff1a1a] text-white text-xs font-black shadow-lg cursor-pointer"
          >
            إعادة التحدي
          </button>
        </div>
      ) : (
        currentQ && (
          <div>
            {/* Progress */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
              <span>
                {currentQ.category === 'movies' ? '🎬 قسم الأفلام والمسلسلات' : '⚽ قسم نجوم كرة القدم'}
              </span>
              <span className="font-mono tabular-nums">
                سؤال {qIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Emoji Clue Card */}
            <div className="rounded-2xl bg-[#0c0c0c] border border-[#2a2a2a] p-5 text-center mb-5">
              <div className="text-4xl sm:text-5xl tracking-widest mb-3">{currentQ.emojis}</div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{currentQ.hint}</p>
            </div>

            {/* 4 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isAnswer = idx === currentQ.answerIndex;
                let btnStyle = 'bg-[#1c1c1c] hover:bg-[#262626] border-[#303030] text-white';

                if (selectedOption !== null) {
                  if (isAnswer) {
                    btnStyle = 'bg-emerald-600/30 border-emerald-400 text-emerald-200';
                  } else if (isSelected) {
                    btnStyle = 'bg-[#e50914]/30 border-[#e50914] text-red-200';
                  } else {
                    btnStyle = 'bg-[#161616] border-[#242424] text-zinc-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={selectedOption !== null}
                    className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between gap-2 text-right ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {selectedOption !== null && isAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {selectedOption !== null && isSelected && !isAnswer && <XCircle className="w-4 h-4 text-[#ff4d4d] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};

// ==================== MAIN GAMES ZONE ====================
export const GamesZone: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameTab>('xo');

  return (
    <section className="min-h-screen pt-20 sm:pt-24 pb-28 px-4 sm:px-6 md:px-12 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        {/* Hero Header */}
        <div className="rounded-3xl p-5 sm:p-7 bg-gradient-to-l from-[#1a0608] via-[#141414] to-[#111111] border border-[#e50914]/35 shadow-2xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#e50914] flex items-center justify-center text-white shadow-lg shadow-[#e50914]/35 shrink-0">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-black text-white">صالة الألعاب المصغرة</h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  استمتع بـ 3 ألعاب سريعة مباشرة باللمس أو لوحة المفاتيح مع حفظ أعلى النتائج
                </p>
              </div>
            </div>

            {/* Game Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveGame('xo')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  activeGame === 'xo'
                    ? 'bg-[#e50914] text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                إكس-أو (X-O)
              </button>
              <button
                onClick={() => setActiveGame('snake')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  activeGame === 'snake'
                    ? 'bg-[#e50914] text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                الثعبان الكلاسيكية
              </button>
              <button
                onClick={() => setActiveGame('quiz')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeGame === 'quiz'
                    ? 'bg-[#e50914] text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تحدي التخمين</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Game Stage */}
        {activeGame === 'xo' && <TicTacToeGame />}
        {activeGame === 'snake' && <SnakeGame />}
        {activeGame === 'quiz' && <GuessChallengeGame />}
      </div>
    </section>
  );
};
