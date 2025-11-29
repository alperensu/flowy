'use client';
import { X } from 'lucide-react';
import Image from 'next/image';
import { signIn } from "next-auth/react";
import { useLanguage } from '@/context/LanguageContext';

export default function LoginModal({ isOpen, onClose }) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#121212] w-full max-w-md rounded-xl p-8 relative flex flex-col items-center gap-6 border border-white/10">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                    <X size={24} />
                </button>

                <h2 className="text-3xl font-bold text-white text-center">{t.login.title}</h2>

                <button
                    onClick={() => signIn('google')}
                    className="w-full border border-gray-500 rounded-full py-3 px-6 flex items-center justify-center gap-3 hover:border-white hover:bg-[#1a1a1a] transition group"
                >
                    <div className="relative w-5 h-5">
                        <Image src="https://www.google.com/favicon.ico" alt="Google" fill sizes="20px" />
                    </div>
                    <span className="text-white font-bold group-hover:text-white">{t.login.google}</span>
                </button>

                <button className="w-full border border-gray-500 rounded-full py-3 px-6 flex items-center justify-center gap-3 hover:border-white hover:bg-[#1a1a1a] transition">
                    <span className="text-white font-bold">{t.login.facebook}</span>
                </button>

                <button className="w-full border border-gray-500 rounded-full py-3 px-6 flex items-center justify-center gap-3 hover:border-white hover:bg-[#1a1a1a] transition">
                    <span className="text-white font-bold">{t.login.apple}</span>
                </button>

                <div className="w-full h-[1px] bg-[#2a2a2a] my-2" />

                <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-1">
                        <label className="text-white font-bold text-sm">{t.login.emailOrUsername}</label>
                        <input type="text" placeholder={t.login.emailOrUsername} className="bg-[#121212] border border-[#727272] rounded-md p-3 text-white focus:border-white focus:outline-none transition" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-white font-bold text-sm">{t.login.password}</label>
                        <input type="password" placeholder={t.login.password} className="bg-[#121212] border border-[#727272] rounded-md p-3 text-white focus:border-white focus:outline-none transition" />
                    </div>
                    <button className="bg-green-500 text-black font-bold rounded-full py-3 mt-2 hover:scale-105 transition">{t.login.loginButton}</button>
                </div>
            </div>
        </div>
    );
}
