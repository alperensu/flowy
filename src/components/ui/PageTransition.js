'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export default function PageTransition({ children }) {
    const pathname = usePathname();
    const [displayChildren, setDisplayChildren] = useState(children);
    const [transitionStage, setTransitionStage] = useState('enter'); // enter, exit
    const [isBack, setIsBack] = useState(false);
    const prevPathname = useRef(pathname);

    useEffect(() => {
        if (pathname !== prevPathname.current) {
            // Determine direction (simple heuristic: shorter path = back, or maintain history stack)
            // For now, let's assume if the new path is shorter, it's a "back" action, or if we are going to home.
            const isGoingBack = pathname.length < prevPathname.current.length || pathname === '/';
            setIsBack(isGoingBack);

            setTransitionStage('exit');

            // Wait for exit animation to finish before swapping content
            const timeout = setTimeout(() => {
                setDisplayChildren(children);
                setTransitionStage('enter');
                prevPathname.current = pathname;
            }, 300); // Match CSS animation duration

            return () => clearTimeout(timeout);
        } else {
            setDisplayChildren(children);
        }
    }, [pathname, children]);

    const getAnimationClass = () => {
        if (transitionStage === 'exit') {
            return isBack ? 'page-exit-back' : 'page-exit';
        }
        if (transitionStage === 'enter') {
            return isBack ? 'page-enter-back' : 'page-enter';
        }
        return '';
    };

    return (
        <div className={`w-full h-full ${getAnimationClass()}`}>
            {displayChildren}
        </div>
    );
}
