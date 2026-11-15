import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Terminal, 
  MonitorPlay, 
  Box, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';

interface PythonWindowsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonWindowsExportModal: React.FC<PythonWindowsExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'commands'>('guide');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Function to download files dynamically
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Requirements content
  const requirementsTxt = `customtkinter>=5.2.0\npython-vlc>=3.0.18105\nrequests>=2.31.0\npyinstaller>=6.0.0`;

  // Build batch script content
  const buildExeBat = `@echo off\nchcp 65001 > nul\necho ============================================================\necho      بناء برنامج Awn Tv pro كملف تنفيذي مستقل (.exe)\necho ============================================================\necho.\necho [1/3] جاري تثبيت المكتبات المطلوبة...\npip install -r requirements.txt\necho.\necho [2/3] جاري تحويل الكود إلى ملف تنفيذي عبر PyInstaller...\npyinstaller --noconsole --onefile --clean --name "Awn_Tv_pro" app.py\necho.\necho [3/3] تم البناء بنجاح! ستجد ملف البرنامج داخل مجلد: dist\\Awn_Tv_pro.exe\npause`;

  // Run batch script content
  const runBat = `@echo off\nchcp 65001 > nul\necho تشغيل تطبيق Awn Tv pro...\npip install -r requirements.txt\npython app.py\npause`;

  const pythonCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Awn Tv pro - رسيفر ذكي ومشغل وسائط متكامل (Windows Edition)
"""
import os, sys, json, re, glob, threading
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

try:
    import vlc
except ImportError:
    pass

# الكود الكامل متاح ومحفوظ في ملف app.py في المشروع
# اضغط على زر 'تحميل app.py' لتحميل الملف بالكامل
`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#2b2b2b] w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative text-white flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <MonitorPlay className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>تطبيق الويندوز المستقل (Python & PyInstaller)</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                جاهز للتحميل
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              الملف الكامل <span className="font-mono text-amber-400">app.py</span> وملفات التثبيت الآلي لبناء ملف تنفيذي مستقل <span className="font-mono text-zinc-300">Awn_Tv_pro.exe</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#262626] pb-3 mb-4 shrink-0">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-[#cc0000] text-white shadow-md'
                : 'bg-[#1c1c1c] text-zinc-400 hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>خطوات التثبيت والبناء (للمبتدئين)</span>
          </button>

          <button
            onClick={() => setActiveTab('commands')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'commands'
                ? 'bg-[#cc0000] text-white shadow-md'
                : 'bg-[#1c1c1c] text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>الأوامر والملفات الجاهزة</span>
          </button>
        </div>

        {/* Tab 1: Step by Step Guide for Beginners */}
        {activeTab === 'guide' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            {/* Quick 1-Click Download Bar */}
            <div className="p-4 bg-gradient-to-r from-amber-950/30 to-orange-950/20 border border-amber-600/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-bold text-amber-300 text-sm">ملفات المشروع جاهزة ومحفوظة لديك الآن!</p>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  يمكنك تحميل ملفات التشغيل التلقائي بنقرة واحدة ووضعها في نفس المجلد مع <code className="text-white font-mono">app.py</code>:
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => downloadFile('requirements.txt', requirementsTxt)}
                  className="px-3 py-1.5 bg-[#222222] hover:bg-[#2e2e2e] text-zinc-200 rounded-lg text-xs font-mono border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>requirements.txt</span>
                </button>
                <button
                  onClick={() => downloadFile('build_exe.bat', buildExeBat)}
                  className="px-3 py-1.5 bg-[#cc0000] hover:bg-[#ff1a1a] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>build_exe.bat (تلقائي)</span>
                </button>
              </div>
            </div>

            {/* Step 1 */}
            <div className="p-4 bg-[#181818] border border-[#262626] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-[#cc0000] text-white text-xs flex items-center justify-center font-mono">1</span>
                <span>تثبيت Python (لمرة واحدة على الكمبيوتر)</span>
              </div>
              <p className="text-zinc-300 leading-relaxed pr-8">
                قم بتحميل وتثبيت بايثون من الموقع الرسمي 
                <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer" className="text-amber-400 font-bold mx-1 underline inline-flex items-center gap-0.5">
                  python.org <ExternalLink className="w-3 h-3" />
                </a>.
                <br />
                <span className="text-[#ff4d4d] font-bold">⚠️ خطوة مهمة جداً:</span> أثناء التثبيت في أول شاشة تظهر لك، ضع علامة صح ✅ على خيار:
                <code className="bg-black/60 px-2 py-0.5 rounded text-amber-300 font-mono mx-1">Add python.exe to PATH</code> ثم اضغط Install Now.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-[#181818] border border-[#262626] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-[#cc0000] text-white text-xs flex items-center justify-center font-mono">2</span>
                <span>تثبيت برنامج VLC Media Player</span>
              </div>
              <p className="text-zinc-300 leading-relaxed pr-8">
                التطبيق يستخدم محرك VLC القوي لتشغيل جميع صيغ البث المباشر وأفلام IPTV بجودة فائقة وبدون تقطيع.
                تأكد من تنصيب مشغل VLC العادي (64-bit) على ويندوز من موقعه الرسمي:
                <a href="https://www.videolan.org/vlc/" target="_blank" rel="noreferrer" className="text-amber-400 font-bold mx-1 underline inline-flex items-center gap-0.5">
                  videolan.org/vlc <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-[#181818] border border-[#262626] rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-[#cc0000] text-white text-xs flex items-center justify-center font-mono">3</span>
                <span>البناء بضغطة زر واحدة إلى Awn_Tv_pro.exe</span>
              </div>
              <p className="text-zinc-300 leading-relaxed pr-8">
                قم بالضغط مرتين (Double Click) على الملف:
                <code className="bg-black/60 px-2 py-0.5 rounded text-emerald-400 font-mono mx-1">build_exe.bat</code>.
                <br />
                سيقوم تلقائياً بتثبيت مكتبات <code className="text-zinc-400 font-mono">customtkinter</code> و <code className="text-zinc-400 font-mono">python-vlc</code> و <code className="text-zinc-400 font-mono">pyinstaller</code> ثم تجميع البرنامج.
                <br />
                بمجرد اكتمال العملية ستجد البرنامج التنفيذي المستقل جاهزاً في مجلد:
                <br />
                <code className="bg-black/80 text-white font-mono px-3 py-1 rounded-lg block mt-1 border border-[#333333] text-center font-bold">
                  📁 dist\Awn_Tv_pro.exe
                </code>
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Commands & Code View */}
        {activeTab === 'commands' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="p-4 bg-[#181818] border border-[#262626] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">أمر تثبيت المكتبات (Terminal / CMD):</span>
                <button
                  onClick={() => copyToClipboard('pip install customtkinter python-vlc requests pyinstaller')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'تم النسخ!' : 'نسخ الأمر'}</span>
                </button>
              </div>
              <div className="p-3 bg-black/80 rounded-xl font-mono text-emerald-400 text-xs border border-[#333333] dir-ltr text-left overflow-x-auto">
                pip install customtkinter python-vlc requests pyinstaller
              </div>
            </div>

            <div className="p-4 bg-[#181818] border border-[#262626] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">أمر التشغيل المباشر عبر بايثون:</span>
                <button
                  onClick={() => copyToClipboard('python app.py')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>نسخ الأمر</span>
                </button>
              </div>
              <div className="p-3 bg-black/80 rounded-xl font-mono text-amber-400 text-xs border border-[#333333] dir-ltr text-left">
                python app.py
              </div>
            </div>

            <div className="p-4 bg-[#181818] border border-[#262626] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">أمر التحويل إلى ملف مستقل (EXE):</span>
                <button
                  onClick={() => copyToClipboard('pyinstaller --noconsole --onefile --clean --name "Awn_Tv_pro" app.py')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>نسخ الأمر</span>
                </button>
              </div>
              <div className="p-3 bg-black/80 rounded-xl font-mono text-[#ff4d4d] text-xs border border-[#333333] dir-ltr text-left overflow-x-auto">
                pyinstaller --noconsole --onefile --clean --name "Awn_Tv_pro" app.py
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#262626] mt-4 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-zinc-500">
            الملفات <span className="font-mono text-zinc-400">app.py</span> و <span className="font-mono text-zinc-400">build_exe.bat</span> محفوظة مسبقاً في مجلد المشروع الرئيسي.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl cursor-pointer transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
